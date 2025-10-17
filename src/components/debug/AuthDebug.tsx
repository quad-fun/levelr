'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export function AuthDebug() {
  const { user, isLoaded } = useUser();
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch flags to see what the user has access to
      fetch('/api/dev/flags')
        .then(res => res.json())
        .then(data => setFlags(data))
        .catch(err => console.error('Error fetching flags:', err));
    }
  }, [user]);

  if (!isLoaded) {
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">Loading authentication...</div>;
  }

  if (!user) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold text-red-800">Not Authenticated</h3>
        <p className="text-red-700">Please sign in to use the application.</p>
      </div>
    );
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const isAdmin = email === 'johnny@quadfund.io';

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <h3 className="font-semibold text-green-800 mb-2">Authentication Status</h3>

      <div className="space-y-2 text-sm">
        <div><strong>Email:</strong> {email}</div>
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>Username:</strong> {user.username || 'Not set'}</div>
        <div><strong>Admin Status:</strong> {isAdmin ? '✅ Admin' : '❌ Not Admin'}</div>

        {flags && (
          <div className="mt-3">
            <strong>Active Flags:</strong>
            <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
              {Object.entries(flags).map(([key, value]) => (
                <div key={key} className={`${value ? 'text-green-700' : 'text-red-700'}`}>
                  {key}: {value ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}