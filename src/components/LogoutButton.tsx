// src/components/LogoutButton.tsx
export default function LogoutButton() {
    return (
        <form action="/api/auth/signout" method="POST">
            <input type="hidden" name="callbackUrl" value="/login" />
            <button type="submit" className="text-sm text-blue-600 hover:underline">
                Logout
            </button>
        </form>
    );
}
