// pages/signup.tsx
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

function SignUpPage({ signOut, user }) {
  return (
    <div className="text-white bg-black h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.username}</h1>
      <p className="mb-6">You're signed in and ready to use Latimere Host OS.</p>
      <button
        onClick={signOut}
        className="bg-cyan-600 px-6 py-2 rounded hover:bg-cyan-500"
      >
        Sign out
      </button>
    </div>
  );
}

export default withAuthenticator(SignUpPage);
