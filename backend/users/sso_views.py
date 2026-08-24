"""
Single Sign-On (SSO) views for DuckRow integration with home-web EME Portal.
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
        # Fallback check: attempt unsigning with explicit home-web shared secret key
        fallback_key = 'django-insecure-*-*vs4z#2b-qzwp=j!qwucji$9s70!#+rjqm@o97ea=mwr6z81'
        try:
            fallback_signer = TimestampSigner(key=fallback_key, salt=salt)
            payload = fallback_signer.unsign_object(token, max_age=120)
        except Exception as fallback_e:
            print(f"[SSO ERROR] Firma del token inválida (verificar SECRET_KEY o salt): {fallback_e}")
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
        if isinstance(area_single, str) and area_single.strip():
            target_area_names.add(area_single.strip())
        if isinstance(areas_list, list):
            for a_item in areas_list:
                if isinstance(a_item, str) and a_item.strip():
                    target_area_names.add(a_item.strip())

        # Fallback to role name if no area fields were specified
        if not target_area_names:
            fallback_name = str(payload.get('rol', 'General')).strip()
            target_area_names.add(fallback_name)

        # Get or create Area objects and associate them with the user profile
        area_objs = []
        for name in target_area_names:
            area_obj, _ = Area.objects.get_or_create(name=name)
            area_objs.append(area_obj)

        profile.areas.add(*area_objs)

    # 3. Generate SimpleJWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # 4. Redirect to frontend SSO callback landing page with tokens in URL hash
    host = request.headers.get('Host', '')
    scheme = 'https' if request.is_secure() else 'http'
    
    # If request hit Django backend port (8900 or 8000) directly, route redirect to frontend Vite port (5173)
    if ':8900' in host:
        frontend_origin = f"{scheme}://{host.replace(':8900', ':5173')}"
    elif ':8000' in host:
        frontend_origin = f"{scheme}://{host.replace(':8000', ':5173')}"
    else:
        frontend_origin = ""

    frontend_sso_url = f"{frontend_origin}/sso-callback#access={access_token}&refresh={refresh_token}"
    return redirect(frontend_sso_url)
