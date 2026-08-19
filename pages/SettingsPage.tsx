import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.COMMUNITY_MEMBER);
  const [addUserLoading, setAddUserLoading] = useState<boolean>(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    if (isAdmin) {
      setUsers(authService.getAllUsers());
    }
  }, [isAdmin]);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setUsers);
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setAddUserError('Username cannot be empty.');
      return;
    }
    setAddUserLoading(true);
    setAddUserError(null);
    try {
      const response = await authService.addUser(newUsername, newUserRole);
      if (response.success) {
        setNewUsername('');
        setNewUserRole(UserRole.COMMUNITY_MEMBER);
        // Users will be updated via subscription
      } else {
        setAddUserError(response.message || 'Failed to add user.');
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setAddUserError('An unexpected error occurred.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await authService.deleteUser(deleteUserId);
      if (response.success) {
        setDeleteUserId(null); // Close dialog
        // Users will be updated via subscription
      } else {
        setDeleteError(response.message || 'Failed to delete user.');
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setDeleteError('An unexpected error occurred.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600">You do not have permission to view this page. Only administrators can access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Application Settings</h3>
        <p className="text-gray-700">This is a placeholder for application settings.</p>
        <div className="text-gray-500 mt-2">
          Future features here could include:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Bin threshold configuration</li>
            <li>Notification preferences</li>
            <li>API key management (for external integrations)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">User Management</h3>

        {/* Add User Form */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-xl font-medium text-gray-700 mb-3">Add New User</h4>
          <form onSubmit={handleAddUser} className="space-y-4">
            {addUserError && <p className="text-red-600 text-sm bg-red-100 p-2 rounded">{addUserError}</p>}
            <div>
              <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
                disabled={addUserLoading}
              />
            </div>
            <div>
              <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="newUserRole"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={addUserLoading}
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={addUserLoading}
            >
              {addUserLoading ? (
                <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Add User'}
            </button>
          </form>
        </div>

        {/* User List Table */}
        <h4 className="text-xl font-medium text-gray-700 mb-3">Existing Users</h4>
        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.role.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user?.id !== u.id && ( // Prevent admin from deleting themselves
                        <button
                          onClick={() => setDeleteUserId(u.id)}
                          className="text-danger hover:text-red-900 ml-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                          aria-label={`Delete user ${u.username}`}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteUserId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 id="delete-dialog-title" className="text-lg font-bold text-gray-900 mb-3">Confirm Deletion</h3>
            <p id="delete-dialog-description" className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            {deleteError && <p className="text-red-600 text-sm bg-red-100 p-2 rounded mb-4">{deleteError}</p>}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteUserId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-danger text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;