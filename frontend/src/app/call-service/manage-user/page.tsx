"use client";

import React, { useState, useEffect } from "react";
import { userService, User, CreateUserRequest } from "@/services/userService";
import { serviceService } from "@/services/serviceService";
import { callUserService } from "@/services/call-service/callUserService";
import { areaBranchService, Area, Subarea, Branch } from "@/services/areaBranchService";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import { CallMultiSelectHierarchyDropdown } from "@/components/call-service/CallHierarchyDropdown";
import { apiFetch } from "@/services/httpClient";

const getStoredUserId = (): number | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const userStr = window.localStorage.getItem("user");
    if (!userStr) {
        return null;
    }

    try {
        const parsed = JSON.parse(userStr);
        return parsed?.id ?? null;
    } catch {
        return null;
    }
};

const fetchAndCacheUserId = async (): Promise<number | null> => {
    try {
        const response = await apiFetch("/api/auth/me", { method: "GET" });

        if (!response.ok) {
            return null;
        }

        const user = await response.json();
        if (user?.id && typeof window !== "undefined") {
            window.localStorage.setItem("user", JSON.stringify(user));
            return user.id;
        }
        return user?.id ?? null;
    } catch (error) {
        console.error("Failed to fetch current user info", error);
        return null;
    }
};

export default function ManageUserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [callServiceId, setCallServiceId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        password: "",
        phone: "",
    });

    // Hierarchy data
    const [areas, setAreas] = useState<Area[]>([]);
    const [subAreas, setSubAreas] = useState<Subarea[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Assignment state for new user
    const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
    const [selectedSubAreaIds, setSelectedSubAreaIds] = useState<number[]>([]);
    const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);

    // Assignment state for edit user
    const [editAreaIds, setEditAreaIds] = useState<number[]>([]);
    const [editSubAreaIds, setEditSubAreaIds] = useState<number[]>([]);
    const [editBranchIds, setEditBranchIds] = useState<number[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Edit user state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({
        fullName: "",
        username: "",
        phone: "",
    });

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredUsers = users.filter((user) => {
        const fullName = (user.fullName ?? "").toLowerCase();
        const username = (user.username ?? "").toLowerCase();
        return (
            fullName.includes(normalizedSearch) || username.includes(normalizedSearch)
        );
    });

    // Fetch data on component mount
    useEffect(() => {
        fetchUsers();
        fetchCallServiceId();
        loadHierarchyData();
    }, []);

    const fetchCallServiceId = async () => {
        try {
            const callService = await serviceService.getServiceByCode("call-service");
            setCallServiceId(callService.id);
        } catch (error) {
            console.error("Error fetching call service:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch users directly from call service
            console.log("Fetching users from call service...");
            const usersData = await callUserService.getCallUsers();
            console.log("Call users fetched:", usersData.length);

            setUsers(usersData);
        } catch (err) {
            setError("Failed to fetch users. Please try again.");
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadHierarchyData = async () => {
        try {
            // Load areas, subareas, and branches
            const [areasData, subAreasData, branchesData] = await Promise.all([
                areaBranchService.getAreas(),
                areaBranchService.getSubareas(),
                areaBranchService.getBranches()
            ]);

            setAreas(areasData);
            setSubAreas(subAreasData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Error loading hierarchy data:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Simple cascade handlers
    const handleSubAreaChange = (newSubAreaIds: number[]) => {
        console.log("=== handleSubAreaChange Debug ===");
        console.log("Previous selectedSubAreaIds:", selectedSubAreaIds);
        console.log("New subAreaIds:", newSubAreaIds);

        // Find which subareas were removed
        const removedSubAreas = selectedSubAreaIds.filter(id => !newSubAreaIds.includes(id));
        console.log("Removed subareas:", removedSubAreas);

        if (removedSubAreas.length > 0) {
            // Remove all branches within the removed subareas
            const branchesToRemove = branches
                .filter(branch => removedSubAreas.includes(branch.subareaId))
                .map(branch => branch.id);
            console.log("Branches to remove due to subarea removal:", branchesToRemove);

            const updatedBranchIds = selectedBranchIds.filter(id => !branchesToRemove.includes(id));
            console.log("Updated selectedBranchIds:", updatedBranchIds);
            setSelectedBranchIds(updatedBranchIds);
        }

        setSelectedSubAreaIds(newSubAreaIds);
        console.log("Final selectedSubAreaIds set to:", newSubAreaIds);
    };

    const handleEditSubAreaChange = (newSubAreaIds: number[]) => {
        console.log("=== handleEditSubAreaChange Debug ===");
        console.log("Previous editSubAreaIds:", editSubAreaIds);
        console.log("New subAreaIds:", newSubAreaIds);

        // Find which subareas were removed
        const removedSubAreas = editSubAreaIds.filter(id => !newSubAreaIds.includes(id));
        console.log("Removed subareas:", removedSubAreas);

        if (removedSubAreas.length > 0) {
            // Remove all branches within the removed subareas
            const branchesToRemove = branches
                .filter(branch => removedSubAreas.includes(branch.subareaId))
                .map(branch => branch.id);
            console.log("Branches to remove due to subarea removal:", branchesToRemove);

            const updatedBranchIds = editBranchIds.filter(id => !branchesToRemove.includes(id));
            console.log("Updated editBranchIds:", updatedBranchIds);
            setEditBranchIds(updatedBranchIds);
        }

        setEditSubAreaIds(newSubAreaIds);
        console.log("Final editSubAreaIds set to:", newSubAreaIds);
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
                serviceIds: callServiceId ? [callServiceId] : undefined, // Auto-assign call-service
            };

            const newUser = await userService.createUser(userData);
            setUsers((prev) => [...prev, newUser]);
            setFormData({
                fullName: "",
                username: "",
                password: "",
                phone: "",
            });

            // Create assignments based on selection
            const newBranchIds: number[] = [];

            if (selectedBranchIds.length > 0) {
                // Branches selected - assign to specific branches
                newBranchIds.push(...selectedBranchIds);
            } else if (selectedSubAreaIds.length > 0) {
                // Sub-areas selected - assign to all branches in these sub-areas
                selectedSubAreaIds.forEach(subAreaId => {
                    const subAreaBranches = branches.filter(b => b.subareaId === subAreaId);
                    newBranchIds.push(...subAreaBranches.map(b => b.id));
                });
            } else if (selectedAreaIds.length > 0) {
                // Areas selected - assign to all branches in these areas
                selectedAreaIds.forEach(areaId => {
                    const subAreasInArea = subAreas.filter(s => s.areaId === areaId);
                    const subAreaBranches = branches.filter(b =>
                        subAreasInArea.some(s => s.id === b.subareaId)
                    );
                    newBranchIds.push(...subAreaBranches.map(b => b.id));
                });
            }

            // Add assignments using individual calls
            for (const branchId of newBranchIds) {
                try {
                    await areaBranchService.assignUserToBranch(newUser.id, branchId);
                } catch (error) {
                    console.warn("Failed to assign user to branch:", branchId, error);
                }
            }

            if (newBranchIds.length > 0) {
                alert(`User created successfully and assigned to ${newBranchIds.length} branch(es)!`);
            } else {
                alert("User created successfully but no branch assignments were made.");
            }

            // Refresh the user list to show the newly created user
            await fetchUsers();

            // Reset selections
            setSelectedAreaIds([]);
            setSelectedSubAreaIds([]);
            setSelectedBranchIds([]);

        } catch (error) {
            console.error("Error creating user:", error);
            alert(
                `Error creating user: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleUserStatus = async (userId: number) => {
        try {
            // Use updateUser to toggle the active status
            const user = users.find((u) => u.id === userId);
            if (user) {
                await userService.updateUser(userId, { active: !user.active });
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)),
                );
                alert("User status updated successfully");
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
            alert(
                `Error updating user status: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    };

    const startEdit = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            fullName: user.fullName || "",
            username: user.username || "",
            phone: user.phone || "",
        });

        // Load user assignments
        loadUserAssignments(user.id);
    };

    const loadUserAssignments = async (userId: number) => {
        try {
            const assignments = await areaBranchService.getUserBranchesByUser(userId);
            const activeAssignments = assignments.filter(a => a.active);

            if (activeAssignments.length > 0) {
                const branchIds = activeAssignments.map(a => a.branchId);
                const areaIds = activeAssignments.map(a => a.areaId).filter(Boolean) as number[];

                // Get sub-area IDs from the branch data (since assignments don't have subAreaId)
                const assignedBranches = branches.filter(b => branchIds.includes(b.id));
                const subAreaIds = [...new Set(assignedBranches
                    .filter(b => b.subareaId)
                    .map(b => b.subareaId))];

                console.log("=== Load User Assignments Debug ===");
                console.log("Active assignments:", activeAssignments.length);
                console.log("Branch IDs:", branchIds);
                console.log("Area IDs:", areaIds);
                console.log("Sub-Area IDs from branches:", subAreaIds);

                // Set selections based on existing assignments - ONLY set explicitly assigned items
                if (branchIds.length > 0) {
                    // Set the branches that were actually assigned
                    setEditBranchIds(branchIds);

                    // Only set sub-areas that have assigned branches (these are the parent sub-areas)
                    if (subAreaIds.length > 0) {
                        setEditSubAreaIds(subAreaIds);
                        console.log("Set editSubAreaIds to parent sub-areas:", subAreaIds);
                    }

                    // Only set areas that were explicitly assigned
                    if (areaIds.length > 0) {
                        setEditAreaIds(areaIds);
                        console.log("Set editAreaIds to explicitly assigned:", areaIds);
                    }

                    console.log("Set editBranchIds to:", branchIds);
                } else if (areaIds.length > 0) {
                    setEditAreaIds(areaIds);
                    console.log("Set editAreaIds to:", areaIds);
                }
            } else {
                console.log("No active assignments found");
                // Clear all selections if no assignments
                setEditAreaIds([]);
                setEditSubAreaIds([]);
                setEditBranchIds([]);
            }
        } catch (error) {
            console.error("Error loading user assignments:", error);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSubmitting(true);
        try {
            // Update user info using call-service
            const updatedUser = await callUserService.updateUser(editingUser.id, {
                fullName: editFormData.fullName,
                phone: editFormData.phone || undefined,
            });

            // Update assignments (remove old and add new)
            const currentAssignments = await areaBranchService.getUserBranchesByUser(editingUser.id);
            const activeAssignments = currentAssignments.filter(a => a.active);

            // Get new branch assignments based on selection - use the same logic as loadUserAssignments
            const newBranchIds: number[] = [];

            console.log("=== Edit Assignment Debug ===");
            console.log("editAreaIds:", editAreaIds);
            console.log("editSubAreaIds:", editSubAreaIds);
            console.log("editBranchIds:", editBranchIds);

            // Priority: Branches > Sub-areas > Areas (most specific to least specific)
            // This ensures that if user explicitly selected branches or sub-areas, we use those
            if (editBranchIds.length > 0) {
                // Only branches selected - assign to specific branches
                console.log("Using branch selection for edit");
                newBranchIds.push(...editBranchIds);
            } else if (editSubAreaIds.length > 0) {
                // Sub-areas selected - assign to all branches in these sub-areas
                console.log("Using sub-area selection for edit");
                editSubAreaIds.forEach(subAreaId => {
                    const subAreaBranches = branches.filter(b => b.subareaId === subAreaId);
                    newBranchIds.push(...subAreaBranches.map(b => b.id));
                });
            } else if (editAreaIds.length > 0) {
                // Areas selected - assign to all branches in these areas
                console.log("Using area selection for edit");
                editAreaIds.forEach(areaId => {
                    const subAreasInArea = subAreas.filter(s => s.areaId === areaId);
                    const subAreaBranches = branches.filter(b =>
                        subAreasInArea.some(s => s.id === b.subareaId)
                    );
                    newBranchIds.push(...subAreaBranches.map(b => b.id));
                });
            }

            console.log("Final newBranchIds for edit:", newBranchIds);

            const currentBranchIds = activeAssignments.map(a => a.branchId);

            console.log("Current branch IDs:", currentBranchIds);
            console.log("New branch IDs:", newBranchIds);

            // Find branches to remove (current but not in new)
            const branchesToRemove = currentBranchIds.filter(id => !newBranchIds.includes(id));

            // Find branches to add (new but not in current)
            const branchesToAdd = newBranchIds.filter(id => !currentBranchIds.includes(id));

            console.log("Branches to remove:", branchesToRemove);
            console.log("Branches to add:", branchesToAdd);

            // Remove old assignments
            for (const branchId of branchesToRemove) {
                try {
                    await areaBranchService.removeUserFromBranch(editingUser.id, branchId);
                    console.log(`Successfully removed user from branch ${branchId}`);
                } catch (error) {
                    console.warn("Failed to remove assignment for branch:", branchId, error);
                }
            }

            // Add new assignments only (skip existing ones)
            for (const branchId of branchesToAdd) {
                try {
                    await areaBranchService.assignUserToBranch(editingUser.id, branchId);
                    console.log(`Successfully assigned user to branch ${branchId}`);
                } catch (error) {
                    console.warn("Failed to assign user to branch:", branchId, error);
                }
            }

            if (branchesToRemove.length > 0 || branchesToAdd.length > 0) {
                alert(`User updated successfully! Removed ${branchesToRemove.length} assignment(s) and added ${branchesToAdd.length} assignment(s).`);
            } else {
                alert("User updated successfully! No changes to assignments.");
            }

            setUsers((prev) =>
                prev.map((u) => (u.id === editingUser.id ? updatedUser : u)),
            );
            await fetchUsers();
            cancelEdit();

        } catch (error) {
            console.error("Error updating user:", error);
            alert(
                `Error updating user: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setEditFormData({
            fullName: "",
            username: "",
            phone: "",
        });
        setEditAreaIds([]);
        setEditSubAreaIds([]);
        setEditBranchIds([]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-white">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Manage Users</h1>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-md">
                        {error}
                    </div>
                )}

                {/* Create User Form */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Create New User</h2>
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
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
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
                        </div>

                        {/* Hierarchy Assignment Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Assign to Area/Sub-Area/Branch
                            </label>
                            <CallMultiSelectHierarchyDropdown
                                areas={areas}
                                subAreas={subAreas}
                                branches={branches}
                                selectedAreaIds={selectedAreaIds}
                                selectedSubAreaIds={selectedSubAreaIds}
                                selectedBranchIds={selectedBranchIds}
                                onAreaChange={setSelectedAreaIds}
                                onSubAreaChange={handleSubAreaChange}
                                onBranchChange={setSelectedBranchIds}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-4">Edit User</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                                            disabled
                                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-slate-400 placeholder-slate-500 cursor-not-allowed"
                                            placeholder="Username cannot be changed"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            Username cannot be changed
                                        </p>
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
                                </div>

                                {/* Edit Hierarchy Assignment Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Update Area/Sub-Area/Branch Assignment
                                    </label>
                                    <CallMultiSelectHierarchyDropdown
                                        areas={areas}
                                        subAreas={subAreas}
                                        branches={branches}
                                        selectedAreaIds={editAreaIds}
                                        selectedSubAreaIds={editSubAreaIds}
                                        selectedBranchIds={editBranchIds}
                                        onAreaChange={setEditAreaIds}
                                        onSubAreaChange={handleEditSubAreaChange}
                                        onBranchChange={setEditBranchIds}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "Updating..." : "Update User"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Search and User List */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">Users</h3>
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

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800 divide-y divide-slate-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">
                                                {user.fullName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">{user.username}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">{user.phone || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {user.active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggleUserStatus(user.id)}
                                                className={`${user.active
                                                    ? "text-yellow-400 hover:text-yellow-300"
                                                    : "text-green-400 hover:text-green-300"
                                                    }`}
                                            >
                                                {user.active ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            {searchTerm
                                ? "No users found matching your search."
                                : "No users found."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
