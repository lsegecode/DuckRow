"""
Teams notifications integration via Power Automate / Workflows HTTP Webhook.
Sends Adaptive Cards to Microsoft Teams when:
1. A new ticket is created.
2. A ticket is marked as resolved / ready for review (para cerrar).
"""

import threading
try:
    import requests
except ImportError:
    requests = None

from django.conf import settings


def _send_payload_async(webhook_url: str, payload: dict):
    """Worker function executed in background thread."""
    if not requests:
        print("[TEAMS WEBHOOK WARNING] El paquete 'requests' no está instalado en el entorno. Ejecuta 'pip install requests'.")
        return

    try:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(webhook_url, json=payload, headers=headers, timeout=10)
        if response.status_code in (200, 201, 202):
            print(f"[TEAMS WEBHOOK SUCCESS] Notificación enviada correctamente a Teams (HTTP {response.status_code})")
        else:
            print(f"[TEAMS WEBHOOK WARNING] Teams respondió con código {response.status_code}: {response.text[:200]}")
    except Exception as e:
        print(f"[TEAMS WEBHOOK ERROR] Error enviando alerta a Teams: {e}")


def _build_ticket_url(ticket_id):
    frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    return f"{frontend_base}/tickets/{ticket_id}"


def notify_ticket_created(ticket):
    """
    Constructs an Adaptive Card (v1.4) for NEW tickets
    and dispatches it asynchronously to Microsoft Teams.
    """
    webhook_url = getattr(settings, 'TEAMS_WEBHOOK_URL', '').strip()
    if not webhook_url:
        return

    ticket_url = _build_ticket_url(ticket.id)
    type_label = '🐞 Error / Bug' if ticket.ticket_type == 'BUG' else '✨ Solicitud / Mejora'
    area_name = ticket.source_area.name if ticket.source_area else 'General'

    facts = [
        {"title": "🏷️ Tipo:", "value": type_label},
        {"title": "🏢 Área:", "value": area_name},
        {"title": "📌 Título:", "value": ticket.title},
    ]

    payload = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptivecard-schema.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": "🦆 Nuevo Ticket",
                            "weight": "Bolder",
                            "size": "Large",
                            "color": "Accent"
                        },
                        {
                            "type": "FactSet",
                            "facts": facts
                        },
                        {
                            "type": "TextBlock",
                            "text": f"🔗 [Abrir ticket en DuckRow]({ticket_url})",
                            "weight": "Bolder",
                            "size": "Medium",
                            "color": "Accent",
                            "spacing": "Medium"
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "🦆 Abrir Ticket en DuckRow",
                            "url": ticket_url
                        }
                    ]
                }
            }
        ]
    }

    thread = threading.Thread(target=_send_payload_async, args=(webhook_url, payload), daemon=True)
    thread.start()


def notify_ticket_ready_for_review(ticket):
    """
    Constructs an Adaptive Card (v1.4) for tickets READY FOR REVIEW / CLOSING
    and dispatches it asynchronously to Microsoft Teams.
    """
    webhook_url = getattr(settings, 'TEAMS_WEBHOOK_URL', '').strip()
    if not webhook_url:
        return

    ticket_url = _build_ticket_url(ticket.id)
    type_label = '🐞 Error / Bug' if ticket.ticket_type == 'BUG' else '✨ Solicitud / Mejora'
    area_name = ticket.source_area.name if ticket.source_area else 'General'

    facts = [
        {"title": "🏷️ Tipo:", "value": type_label},
        {"title": "🏢 Área:", "value": area_name},
        {"title": "📌 Título:", "value": ticket.title},
    ]

    payload = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptivecard-schema.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": "🏁 Ticket para Cerrar (Revisión)",
                            "weight": "Bolder",
                            "size": "Large",
                            "color": "Good"
                        },
                        {
                            "type": "FactSet",
                            "facts": facts
                        },
                        {
                            "type": "TextBlock",
                            "text": f"🔗 [Abrir ticket en DuckRow]({ticket_url})",
                            "weight": "Bolder",
                            "size": "Medium",
                            "color": "Accent",
                            "spacing": "Medium"
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "🦆 Abrir Ticket en DuckRow",
                            "url": ticket_url
                        }
                    ]
                }
            }
        ]
    }

    thread = threading.Thread(target=_send_payload_async, args=(webhook_url, payload), daemon=True)
    thread.start()
