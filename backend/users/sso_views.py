"""
Single Sign-On (SSO) views for DuckRow integration with Home Portal.
"""

from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Area

User = get_user_model()


import json
from pathlib import Path

def get_override_role(username: str, default_role: str) -> str:
    """
    Checks role_overrides.json in backend/ or root project directory
    to see if the given username has an explicit role assignment.
    """
    base_dir = Path(settings.BASE_DIR)
    json_paths = [
        base_dir / 'role_overrides.json',
        base_dir.parent / 'role_overrides.json',
    ]

    clean_username = username.strip().lower()

    for path in json_paths:
        if path.exists():
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                for role_name, usernames in data.items():
                    if isinstance(usernames, list):
                        normalized_list = [str(u).strip().lower() for u in usernames]
                        if clean_username in normalized_list:
                            return role_name.upper()
            except Exception as e:
                print(f"[ROLE OVERRIDE WARNING] Error reading {path}: {e}")

    return default_role


def sso_exchange_view(request):
    """
    Receives an SSO token signed by home-web, verifies signature and max age (120s),
    retrieves or creates the user in DuckRow, updates roles, assigns areas/departments,
    generates SimpleJWT access/refresh tokens, and redirects to the frontend callback.
    """
    token = request.GET.get('token')
    if not token:
        return redirect('/login?error=token_missing')

    salt = getattr(settings, 'HOME_WEB_SSO_SALT', 'duckrow-sso-auth')
    sso_secret_key = getattr(settings, 'HOME_WEB_SSO_SECRET_KEY', None)

    # If a dedicated SSO secret key is set, use it; otherwise fallback to settings.SECRET_KEY
    if sso_secret_key:
        signer = TimestampSigner(key=sso_secret_key, salt=salt)
    else:
        signer = TimestampSigner(salt=salt)

    try:
        # Verify signature and max age (120 seconds)
        payload = signer.unsign_object(token, max_age=120)
    except SignatureExpired as e:
        print(f"[SSO ERROR] Token expirado (>120s): {e}")
        return redirect('/login?error=token_expired')
    except BadSignature as e:
        print(f"[SSO ERROR] Firma del token inválida (verificar HOME_WEB_SSO_SECRET_KEY o salt): {e}")
        return redirect('/login?error=token_invalid')
    except Exception as e:
        print(f"[SSO ERROR] Error verificando SSO token: {e}")
        return redirect('/login?error=token_error')

    username = payload.get('username')
    email = payload.get('email', '')
    first_name = payload.get('first_name', '')
    last_name = payload.get('last_name', '')
    area_single = payload.get('area', '')
    areas_list = payload.get('areas', [])
    rol_home = str(payload.get('rol', 'CLIENT')).upper()

    if not username:
        return redirect('/login?error=invalid_user_data')

    # 1. Get or create user in DuckRow database
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'is_active': True,
        }
    )

    # If user existed, update fields if provided
    if not created:
        updated = False
        if email and user.email != email:
            user.email = email
            updated = True
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated = True
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated = True
        if updated:
            user.save()

    # 2. Update role and area mappings in UserProfile
    if hasattr(user, 'profile'):
        profile = user.profile
        
        # Determine default role from home-web payload
        if user.is_superuser or 'SYSADMIN' in rol_home or 'SUPERUSER' in rol_home:
            default_role = 'SYSADMIN'
        elif any(k in rol_home for k in ['ADMIN', 'SISTEMAS', 'SOPORTE', 'RESOLVER', 'TECNICO', 'DEV', 'IT']):
            default_role = 'RESOLVER'
        else:
            default_role = 'CLIENT'

        # Apply role override from role_overrides.json if configured
        profile.role = get_override_role(user.username, default_role)
        profile.save()

        # Collect target area names specified in home-web payload
        target_area_names = set()
        print(f"[SSO INFO] Authenticating user '{user.username}' with SSO payload: {payload}")

        # Check single-string area keys
        for key in ['area', 'proyecto', 'area_proyecto', 'departamento']:
            val = payload.get(key)
            if isinstance(val, str) and val.strip() and val.strip().upper() not in ('CLIENT', 'CLIENTE', 'USER', 'USUARIO'):
                target_area_names.add(val.strip())
            elif isinstance(val, dict) and 'name' in val:
                target_area_names.add(str(val['name']).strip())

        # Check list area keys
        for key in ['areas', 'proyectos', 'areas_proyecto', 'departamentos']:
            val_list = payload.get(key)
            if isinstance(val_list, list):
                for a_item in val_list:
                    if isinstance(a_item, str) and a_item.strip() and a_item.strip().upper() not in ('CLIENT', 'CLIENTE', 'USER', 'USUARIO'):
                        target_area_names.add(a_item.strip())
                    elif isinstance(a_item, dict) and 'name' in a_item:
                        target_area_names.add(str(a_item['name']).strip())

        # Fallback to role name if specific (e.g. Area/Department name)
        if not target_area_names:
            raw_rol = str(payload.get('rol') or payload.get('role') or '').strip()
            if raw_rol and raw_rol.upper() not in ('CLIENT', 'CLIENTE', 'USER', 'USUARIO', 'NONE'):
                target_area_names.add(raw_rol.capitalize())
            else:
                target_area_names.add('General')

        # Get or create Area objects and associate them with the user profile
        area_objs = []
        for name in target_area_names:
            area_obj, _ = Area.objects.get_or_create(name=name)
            area_objs.append(area_obj)

        if area_objs:
            profile.areas.set(area_objs)

    # 3. Generate SimpleJWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # 4. Redirect to frontend SSO callback landing page with tokens in URL hash
    configured_frontend = getattr(settings, 'FRONTEND_URL', '').strip().rstrip('/')
    host_header = request.get_host()
    host_name = host_header.split(':')[0]
    scheme = 'https' if request.is_secure() else 'http'

    # 1. If request comes from an external/LAN IP or DNS (not localhost), preserve that host on port 5173
    if host_name and host_name not in ('127.0.0.1', 'localhost'):
        frontend_origin = f"{scheme}://{host_name}:5173"
    # 2. If FRONTEND_URL is explicitly configured in .env, use it
    elif configured_frontend:
        frontend_origin = configured_frontend
    # 3. Fallback to host replacement on port 5173
    elif ':8900' in host_header:
        frontend_origin = f"{scheme}://{host_header.replace(':8900', ':5173')}"
    elif ':8000' in host_header:
        frontend_origin = f"{scheme}://{host_header.replace(':8000', ':5173')}"
    else:
        frontend_origin = f"{scheme}://{host_name}:5173" if host_name else ""

    frontend_sso_url = f"{frontend_origin}/sso-callback#access={access_token}&refresh={refresh_token}"
    return redirect(frontend_sso_url)
