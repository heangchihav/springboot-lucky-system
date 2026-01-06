"use client";

import React, { useState, useEffect } from "react";
import {
  userService,
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/services/userService";
import { serviceService, Service } from "@/services/serviceService";

export default function ManageUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    phone: "",
    serviceIds: [] as string[],
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    serviceIds: [] as string[],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      (user.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  );

  // Fetch users and services on component mount
  useEffect(() => {
    fetchUsers();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const servicesData = await serviceService.getActiveServices();
      setServices(servicesData);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userService.getAllUsersFromUserService();
      setUsers(usersData);
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const currentServiceIds = prev.serviceIds || [];

      if (checked) {
        // Add the service if checked
        return {
          ...prev,
          serviceIds: [...currentServiceIds, value],
        };
      } else {
        // Remove the service if unchecked
        return {
          ...prev,
          serviceIds: currentServiceIds.filter((id) => id !== value),
        };
      }
    });
  };

  const handleEditServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setEditFormData((prev) => {
      const currentServiceIds = prev.serviceIds || [];

      let newServiceIds;
      if (checked) {
        // Add the service if checked
        newServiceIds = [...currentServiceIds, value];
      } else {
        // Remove the service if unchecked
        newServiceIds = currentServiceIds.filter((id) => id !== value);
      }

      return {
        ...prev,
        serviceIds: newServiceIds,
      };
    });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);

    // Initialize form data with user details
    setEditFormData({
      fullName: user.fullName,
      username: user.username,
      phone: user.phone || "",
      serviceIds: [],
    });

    // Fetch user's current services
    fetchUserServices(user.id);
  };

  const fetchUserServices = async (userId: number) => {
    try {
      const userServices = await userService.getUserServices(userId);
      const serviceIds = userServices.map((service) => service.id.toString());
      setEditFormData((prev) => ({
        ...prev,
        serviceIds,
      }));
    } catch (error) {
      console.error("Error fetching user services:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: UpdateUserRequest = {
        fullName: editFormData.fullName,
        phone: editFormData.phone || undefined,
        serviceIds:
          editFormData.serviceIds.length > 0
            ? editFormData.serviceIds.map((id) => parseInt(id))
            : undefined,
      };

      // Update user details and services in one call
      const updatedUser = await userService.updateUserWithServices(
        editingUser.id,
        updateData,
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? updatedUser : u)),
      );
      setEditingUser(null);
      setEditFormData({
        fullName: "",
        username: "",
        phone: "",
        serviceIds: [] as string[],
      });

      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert(
        `Error updating user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditFormData({
      fullName: "",
      username: "",
      phone: "",
      serviceIds: [] as string[],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userData: CreateUserRequest = {
        fullName: formData.fullName,
        username: formData.username,
        password: formData.password,
        phone: formData.phone || undefined,
        serviceIds:
          formData.serviceIds.length > 0
            ? formData.serviceIds.map((id) => parseInt(id))
            : undefined,
      };

      const newUser = await userService.createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      setFormData({
        fullName: "",
        username: "",
        password: "",
        phone: "",
        serviceIds: [] as string[],
      });

      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      alert(
        `Error creating user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    console.log("Toggle user status clicked for userId:", userId);
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        console.error("User not found:", userId);
        return;
      }

      console.log("Current user status:", user.active);
      const updatedUser = user.active
        ? await userService.deactivateUser(userId)
        : await userService.activateUser(userId);

      console.log("Updated user from API:", updatedUser);

      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

      alert(
        `User ${updatedUser.active ? "activated" : "deactivated"} successfully!`,
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert(
        `Error updating user status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const deleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await userService.deleteUser(userId);
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        alert("User deleted successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(
          `Error deleting user: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          User Service · Manage Users
        </h2>
        <p className="text-slate-300">Manage user accounts and permissions.</p>
      </div>

      {/* Create User Form */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4">Create New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Service Assignment (Optional)
              </label>
              <div className="space-y-2">
                {services.map((service) => (
                  <div
                    key={`create-service-${service.id}`}
                    className="flex items-center"
                  >
                    <input
                      type="checkbox"
                      id={`create-service-${service.id}`}
                      name={`create-service-${service.id}`}
                      value={service.id.toString()}
                      checked={formData.serviceIds.includes(
                        service.id.toString(),
                      )}
                      onChange={handleServiceChange}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor={`create-service-${service.id}`}
                      className="ml-2 text-sm font-medium text-slate-300 cursor-pointer"
                    >
                      {service.name} ({service.code})
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select multiple services by checking the boxes
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>

      {/* Edit User Form */}
      {editingUser && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Edit User: {editingUser.fullName}
          </h3>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="editFullName"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="editFullName"
                  name="fullName"
                  value={editFormData.fullName}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label
                  htmlFor="editUsername"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="editUsername"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label
                  htmlFor="editPhone"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="editPhone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Service Assignment (Optional)
                </label>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div
                      key={`edit-service-${service.id}-${editingUser?.id}`}
                      className="flex items-center"
                    >
                      <input
                        type="checkbox"
                        id={`edit-service-${service.id}`}
                        name={`service-${service.id}`}
                        value={service.id.toString()}
                        checked={editFormData.serviceIds.includes(
                          service.id.toString(),
                        )}
                        onChange={handleEditServiceChange}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label
                        htmlFor={`edit-service-${service.id}`}
                        className="ml-2 text-sm font-medium text-slate-300 cursor-pointer"
                      >
                        {service.name} ({service.code})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Select multiple services by checking the boxes
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Updating..." : "Update User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Records Table */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">User Records</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-red-200">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-sm font-medium text-slate-300">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">
                  Created
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    {searchTerm
                      ? "No users found matching your search"
                      : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-4 py-3 text-sm text-white">#{user.id}</td>
                    <td className="px-4 py-3 text-sm text-white">
                      {user.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditUser(user)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.active
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredUsers.length > 0 && (
          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
}
