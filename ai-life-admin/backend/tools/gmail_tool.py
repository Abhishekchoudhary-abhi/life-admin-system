import os
import base64
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar",
]


class GmailTool:

    def __init__(self):
        self.service = self._authenticate()

    def _authenticate(self):
        creds = None

        # Load existing token if it exists
        if os.path.exists("token.json"):
            try:
                creds = Credentials.from_authorized_user_file(
                    "token.json", SCOPES
                )
            except Exception:
                os.remove("token.json")
                creds = None

        # Refresh or re-authenticate if needed
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception:
                    os.remove("token.json")
                    creds = None

            if not creds:
                flow = InstalledAppFlow.from_client_secrets_file(
                    "credentials.json", SCOPES
                )
                creds = flow.run_local_server(port=0)

            # Save token for next time
            with open("token.json", "w") as f:
                f.write(creds.to_json())

        return build("gmail", "v1", credentials=creds)

    def get_unread_emails(self, max_results: int = 10) -> list[dict]:
        """Fetch unread emails from Gmail inbox."""
        results = self.service.users().messages().list(
            userId="me",
            q="is:unread",
            maxResults=max_results
        ).execute()

        messages = results.get("messages", [])
        emails = []

        for msg in messages:
            full = self.service.users().messages().get(
                userId="me",
                id=msg["id"],
                format="full"
            ).execute()
            emails.append(self._parse_email(full))

        return emails

    def get_recent_emails(self, max_results: int = 10) -> list[dict]:
        """Fetch recent emails including already read ones."""
        results = self.service.users().messages().list(
            userId="me",
            maxResults=max_results
        ).execute()

        messages = results.get("messages", [])
        emails = []

        for msg in messages:
            full = self.service.users().messages().get(
                userId="me",
                id=msg["id"],
                format="full"
            ).execute()
            emails.append(self._parse_email(full))

        return emails

    def _parse_email(self, message: dict) -> dict:
        """Extract useful fields from a raw Gmail message."""
        headers = {
            h["name"]: h["value"]
            for h in message["payload"]["headers"]
        }
        body = self._extract_body(message["payload"])
        return {
            "id":      message["id"],
            "sender":  headers.get("From", "Unknown"),
            "subject": headers.get("Subject", "No Subject"),
            "date":    headers.get("Date", ""),
            "body":    body[:2000],
            "snippet": message.get("snippet", ""),
        }

    def _extract_body(self, payload: dict) -> str:
        """Extract plain text body from email payload."""
        if "parts" in payload:
            for part in payload["parts"]:
                if part["mimeType"] == "text/plain":
                    data = part["body"].get("data", "")
                    if data:
                        return base64.urlsafe_b64decode(data).decode(
                            "utf-8", errors="ignore"
                        )

        data = payload.get("body", {}).get("data", "")
        if data:
            return base64.urlsafe_b64decode(data).decode(
                "utf-8", errors="ignore"
            )

        return ""

    def mark_as_read(self, message_id: str):
        """Mark an email as read."""
        self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]}
        ).execute()