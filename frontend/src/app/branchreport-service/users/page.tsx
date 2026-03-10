"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BranchreportServiceGuard } from "@/components/branchreport-service/BranchreportServiceGuard";
import { apiFetch } from "@/services/httpClient";
import { useToast } from "@/components/ui/Toast";
import {
  userService,
  UserInfo,
  CreateUserInfoPayload,
  UpdateUserInfoPayload,
  BranchreportUserAssignment,
  AssignUserRequest
} from "@/services/branchreport-service/userService";
import {
  Area,
  SubArea,
  Branch,
  AreaWithHierarchy,
  SubAreaWithHierarchy,
  BranchWithHierarchy
} from "@/services/region-service/regionService";
import { MultiSelectHierarchyDropdown, toggleSelection } from "@/components/branchreport-service/HierarchyDropdown";

const getStoredUserId = (): string | null => {
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

export default function BranchreportUsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserServiceId, setCurrentUserServiceId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    phone: "",
  });

  const [areas, setAreas] = useState<Area[]>([]);
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [selectedSubAreaIds, setSelectedSubAreaIds] = useState<string[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [currentUserAssignment, setCurrentUserAssignment] = useState<BranchreportUserAssignment | null>(null);
  const [currentUserAssignments, setCurrentUserAssignments] = useState<BranchreportUserAssignment[]>([]);

  // Edit user state
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
  });
  const [editAreaIds, setEditAreaIds] = useState<string[]>([]);
  const [editSubAreaIds, setEditSubAreaIds] = useState<string[]>([]);
  const [editBranchIds, setEditBranchIds] = useState<string[]>([]);
  const [editingUserCurrentAssignment, setEditingUserCurrentAssignment] = useState<BranchreportUserAssignment | null>(null);

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredUsers = users.filter((user) => {
    // Handle undefined user or user properties
    if (!user) return false;

    const fullName = (user.fullName || "").toLowerCase();
    const username = (user.username || "").toLowerCase();
    return (
      fullName.includes(normalizedSearch) || username.includes(normalizedSearch)
    );
  });

  // Cascading logic for dropdowns
  const availableSubAreas = useMemo(() => {
    if (selectedAreaIds.length === 0 && editAreaIds.length === 0) {
      return subAreas; // Show all if no area selected
    }
    const activeAreaIds = editingUser ? editAreaIds : selectedAreaIds;
    return subAreas.filter(subArea => activeAreaIds.includes(subArea.areaId));
  }, [subAreas, selectedAreaIds, editAreaIds, editingUser]);

  const availableBranches = useMemo(() => {
    const activeAreaIds = editingUser ? editAreaIds : selectedAreaIds;
    const activeSubAreaIds = editingUser ? editSubAreaIds : selectedSubAreaIds;

    // If no sub-areas selected, show branches from all selected areas
    if (activeSubAreaIds.length === 0) {
      return branches.filter(branch => activeAreaIds.includes(branch.areaId));
    }

    // Show branches from selected sub-areas
    return branches.filter(branch => activeSubAreaIds.includes(branch.subAreaId));
  }, [branches, selectedAreaIds, selectedSubAreaIds, editAreaIds, editSubAreaIds, editingUser]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchCurrentUserServiceId();
    loadHierarchy();
  }, []);

  // Pre-select current user's assignments and disable other options
  useEffect(() => {
    if (currentUserAssignments.length > 0) {
      // Extract all assigned IDs from current user's assignments
      const assignedAreaIds = currentUserAssignments
        .map(a => a.areaId)
        .filter((id): id is string => id !== null && id !== undefined);
      const assignedSubAreaIds = currentUserAssignments
        .map(a => a.subAreaId)
        .filter((id): id is string => id !== null && id !== undefined);
      const assignedBranchIds = currentUserAssignments
        .map(a => a.branchId)
        .filter((id): id is string => id !== null && id !== undefined);

      // Pre-select current user's assignments
      setSelectedAreaIds(assignedAreaIds);
      setSelectedSubAreaIds(assignedSubAreaIds);
      setSelectedBranchIds(assignedBranchIds);

      // Also set for edit mode
      setEditAreaIds(assignedAreaIds);
      setEditSubAreaIds(assignedSubAreaIds);
      setEditBranchIds(assignedBranchIds);
    }
    // If user has no assignments, show all areas, sub-areas, and branches
    // Don't pre-select anything, let user choose
  }, [currentUserAssignments]);

  // Create assignments for dropdown - if user has assignments, use them; otherwise create dummy assignments to show all
  const dropdownAssignments = useMemo(() => {
    if (currentUserAssignments.length > 0) {
      return currentUserAssignments;
    }

    // Create dummy assignments that include all areas, sub-areas, and branches
    const dummyAssignments: BranchreportUserAssignment[] = [];

    // Add all areas
    areas.forEach(area => {
      dummyAssignments.push({
        id: 0,
        userId: "",
        areaId: area.id,
        subAreaId: undefined,
        branchId: undefined,
        active: true,
        areaName: area.name,
        subAreaName: undefined,
        branchName: undefined,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignmentType: "AREA" as const
      });
    });

    // Add all sub-areas
    subAreas.forEach(subArea => {
      dummyAssignments.push({
        id: 0,
        userId: "",
        areaId: subArea.areaId,
        subAreaId: subArea.id,
        branchId: undefined,
        active: true,
        areaName: areas.find(a => a.id === subArea.areaId)?.name,
        subAreaName: subArea.name,
        branchName: undefined,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignmentType: "SUB_AREA" as const
      });
    });

    // Add all branches
    branches.forEach(branch => {
      dummyAssignments.push({
        id: 0,
        userId: "",
        areaId: branch.areaId,
        subAreaId: branch.subAreaId,
        branchId: branch.id,
        active: true,
        areaName: areas.find(a => a.id === branch.areaId)?.name,
        subAreaName: subAreas.find(s => s.id === branch.subAreaId)?.name,
        branchName: branch.name,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignmentType: "BRANCH" as const
      });
    });

    return dummyAssignments;
  }, [currentUserAssignments, areas, subAreas, branches]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users assigned to branchreport service only
      const data = await userService.listBranchReportUsers();
      // Filter out any undefined or invalid users and ensure active field exists
      const validUsers = data
        .filter(user => user && user.id && user.username)
        .map(user => ({
          ...user,
          // Ensure active field exists - default to true if not present
          active: user.active !== undefined ? user.active : (user.enabled !== undefined ? user.enabled : true)
        }));
      setUsers(validUsers);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to fetch users");
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserServiceId = async () => {
    try {
      const currentUserId = getStoredUserId();
      if (currentUserId) {
        // Get current user's service assignments
        const userServices = await userService.getUserServices(currentUserId);
        if (userServices.length > 0) {
          // Use the first active service (assuming user has only one service assignment)
          const activeService = userServices.find(service => service.active);
          if (activeService) {
            setCurrentUserServiceId(activeService.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching current user service ID:", error);
    }
  };

  const loadHierarchy = async () => {
    try {
      const currentUserId = getStoredUserId();

      // Use branchreport-service endpoints to fetch hierarchy data from region-service
      const [areasResponse, subAreasResponse, branchesResponse] = await Promise.all([
        apiFetch("/api/branchreport/areas"),
        apiFetch("/api/branchreport/sub-areas"),
        apiFetch("/api/branchreport/branches")
      ]);

      const areasResult = await areasResponse.json();
      const subAreasResult = await subAreasResponse.json();
      const branchesResult = await branchesResponse.json();

      const areasData = areasResult.success ? areasResult.data : [];
      const subAreasData = subAreasResult.success ? subAreasResult.data : [];
      const branchesData = branchesResult.success ? branchesResult.data : [];

      console.log("Hierarchy data loaded:", { areasData, subAreasData, branchesData });

      setAreas(areasData);
      setSubAreas(subAreasData);
      setBranches(branchesData);

      if (currentUserId) {
        try {
          const assignments = await userService.getUserAssignments(currentUserId);
          const activeAssignments = assignments.filter(a => a.active);

          if (activeAssignments.length > 0) {
            setCurrentUserAssignments(activeAssignments);
            // Keep the first assignment for backward compatibility
            setCurrentUserAssignment(activeAssignments[0]);

            // Set selections based on the current user's first assignment
            const firstAssignment = activeAssignments[0];
            if (firstAssignment.assignmentType === "AREA" && firstAssignment.areaId) {
              setSelectedAreaIds([firstAssignment.areaId]);
            } else if (firstAssignment.assignmentType === "SUB_AREA" && firstAssignment.subAreaId) {
              setSelectedAreaIds(firstAssignment.areaId ? [firstAssignment.areaId] : []);
              setSelectedSubAreaIds([firstAssignment.subAreaId]);
            } else if (firstAssignment.assignmentType === "BRANCH" && firstAssignment.branchId) {
              setSelectedAreaIds(firstAssignment.areaId ? [firstAssignment.areaId] : []);
              setSelectedSubAreaIds(firstAssignment.subAreaId ? [firstAssignment.subAreaId] : []);
              setSelectedBranchIds([firstAssignment.branchId]);
            }
          }
        } catch (assignmentError) {
          console.error("Error loading current user assignments:", assignmentError);
          // Don't throw error, just continue without assignments
        }
      } else {
        console.log("No current user ID found, skipping assignment loading");
        // Clear any existing assignments
        setCurrentUserAssignments([]);
        setCurrentUserAssignment(null);
        setSelectedAreaIds([]);
        setSelectedSubAreaIds([]);
        setSelectedBranchIds([]);
      }
    } catch (error) {
      console.error("Failed to load hierarchy:", error);
      showToast("Failed to load hierarchy data", "error");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.username) {
      showToast("Name and username are required", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const newUser = await userService.createUser({
        username: formData.username,
        fullName: formData.fullName,
        password: formData.password,
        phone: formData.phone || undefined,
        serviceIds: [5], // Branch report service ID
      });

      // Check if newUser was created successfully
      if (!newUser || !newUser.id) {
        showToast("User creation failed - invalid response", "error");
        return;
      }

      console.log("Created user:", newUser);

      // Create assignments for new user - Hierarchical access control
      const assignmentPromises: Promise<any>[] = [];

      // Hierarchical assignment logic based on user's requirements
      if (selectedBranchIds.length > 0) {
        // Specific branches selected - assign to these branches only
        selectedBranchIds.forEach(branchId => {
          const assignRequest: AssignUserRequest = { userId: newUser.id, branchId };
          assignmentPromises.push(userService.assignUserToHierarchy(assignRequest));
        });
      } else if (selectedSubAreaIds.length > 0) {
        // Sub-areas selected - assign to the sub-area itself AND ALL branches in these sub-areas
        for (const subAreaId of selectedSubAreaIds) {
          // First, assign to the sub-area itself
          const subAreaAssignRequest: AssignUserRequest = { userId: newUser.id, subAreaId };
          assignmentPromises.push(userService.assignUserToHierarchy(subAreaAssignRequest));

          // Get all branches in this sub-area
          const subAreaBranches = branches.filter(branch => branch.subAreaId === subAreaId);
          if (subAreaBranches.length > 0) {
            // Assign to all branches in the sub-area
            subAreaBranches.forEach(branch => {
              const assignRequest: AssignUserRequest = { userId: newUser.id, branchId: branch.id };
              assignmentPromises.push(userService.assignUserToHierarchy(assignRequest));
            });
          }
        }
      } else if (selectedAreaIds.length > 0) {
        // Areas selected - assign to the area itself AND ALL sub-areas and branches in these areas
        for (const areaId of selectedAreaIds) {
          // First, assign to the area itself
          const areaAssignRequest: AssignUserRequest = { userId: newUser.id, areaId };
          assignmentPromises.push(userService.assignUserToHierarchy(areaAssignRequest));

          // Get all sub-areas in this area
          const areaSubAreas = subAreas.filter(subArea => subArea.areaId === areaId);
          if (areaSubAreas.length > 0) {
            // For each sub-area, assign to the sub-area itself AND all its branches
            for (const subArea of areaSubAreas) {
              // Assign to the sub-area itself
              const subAreaAssignRequest: AssignUserRequest = { userId: newUser.id, subAreaId: subArea.id };
              assignmentPromises.push(userService.assignUserToHierarchy(subAreaAssignRequest));

              // Assign to all branches in the sub-area
              const subAreaBranches = branches.filter(branch => branch.subAreaId === subArea.id);
              if (subAreaBranches.length > 0) {
                subAreaBranches.forEach(branch => {
                  const assignRequest: AssignUserRequest = { userId: newUser.id, branchId: branch.id };
                  assignmentPromises.push(userService.assignUserToHierarchy(assignRequest));
                });
              }
            }
          }
        }
      }

      if (assignmentPromises.length > 0) {
        await Promise.all(assignmentPromises);
        showToast(`User created successfully! Created ${assignmentPromises.length} assignment(s) based on your selection.`, "success");
      } else {
        showToast("User created successfully but no assignments were made.", "warning");
      }

      // Add new user to the list immediately (like call-service)
      setUsers((prev) => [...prev, newUser]);

      setFormData({ fullName: "", username: "", password: "", phone: "" });
      setSelectedAreaIds([]);
      setSelectedSubAreaIds([]);
      setSelectedBranchIds([]);

      // Also refresh users list to make sure we have the latest data
      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      showToast("Failed to create user", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadUserAssignment = async (userId: string) => {
    if (!userId) {
      console.error("Invalid user ID provided to loadUserAssignment");
      return;
    }

    try {
      const assignments = await userService.getUserAssignments(userId);
      const activeAssignments = assignments.filter(a => a.active);

      if (activeAssignments.length > 0) {
        // Group assignments by type
        const areaIds = activeAssignments
          .filter(a => a.assignmentType === "AREA" && a.areaId)
          .map(a => a.areaId!);
        const subAreaIds = activeAssignments
          .filter(a => a.assignmentType === "SUB_AREA" && a.subAreaId)
          .map(a => a.subAreaId!);
        const branchIds = activeAssignments
          .filter(a => a.assignmentType === "BRANCH" && a.branchId)
          .map(a => a.branchId!);

        // Set the edit selections based on what assignments exist
        if (areaIds.length > 0) {
          setEditAreaIds(areaIds);
          setEditSubAreaIds([]);
          setEditBranchIds([]);
          setEditSubAreaIds([]);
          setEditBranchIds([]);
        } else if (subAreaIds.length > 0) {
          // Get parent area IDs for sub-areas
          const parentAreaIds = activeAssignments
            .filter(a => a.assignmentType === "SUB_AREA" && a.areaId)
            .map(a => a.areaId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // unique
          setEditAreaIds(parentAreaIds);
          setEditSubAreaIds(subAreaIds);
          setEditBranchIds([]);
        } else if (branchIds.length > 0) {
          // For branch assignments, derive parent area and sub-area IDs from branches data
          const assignedBranches = branches.filter(branch => branchIds.includes(branch.id));
          const parentAreaIds = assignedBranches
            .map(branch => branch.areaId)
            .filter((id, index, arr) => arr.indexOf(id) === index); // unique
          const parentSubAreaIds = assignedBranches
            .map(branch => branch.subAreaId)
            .filter((id, index, arr) => arr.indexOf(id) === index); // unique

          console.log("Branch assignments found:", {
            branchIds,
            parentAreaIds,
            parentSubAreaIds,
            assignedBranches: assignedBranches.map(b => ({ id: b.id, name: b.name, areaId: b.areaId, subAreaId: b.subAreaId }))
          });

          setEditAreaIds(parentAreaIds);
          setEditSubAreaIds(parentSubAreaIds);
          setEditBranchIds(branchIds);
        }

        // Set the first assignment as the current one for compatibility
        setEditingUserCurrentAssignment(activeAssignments[0]);
      } else {
        setEditingUserCurrentAssignment(null);
        // Clear all edit selections when no assignments
        setEditAreaIds([]);
        setEditSubAreaIds([]);
        setEditBranchIds([]);
      }
    } catch (error) {
      console.error("Error loading user assignments:", error);
      showToast("Failed to load user assignments", "error");
      // Clear selections on error
      setEditAreaIds([]);
      setEditSubAreaIds([]);
      setEditBranchIds([]);
    }
  };

  const handleEditUser = async (user: UserInfo) => {
    if (!user || !user.id) {
      showToast("Invalid user data", "error");
      return;
    }

    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName || "",
      username: user.username || "",
      phone: (user as any).phone || "",
    });
    await loadUserAssignment(user.id);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFormData.fullName || !editFormData.username) {
      showToast("Name and username are required", "error");
      return;
    }

    if (!editingUser) return;

    try {
      setIsSubmitting(true);

      const updatedUser = await userService.updateUser(editingUser.id, {
        username: editFormData.username,
        email: `${editFormData.username}@example.com`, // Generate default email
        fullName: editFormData.fullName,
        phone: editFormData.phone || undefined,
      } as UpdateUserInfoPayload);

      // Check if assignment changed
      const currentAssignmentIds = {
        area: editingUserCurrentAssignment?.areaId ? [editingUserCurrentAssignment.areaId] : [],
        subArea: editingUserCurrentAssignment?.subAreaId ? [editingUserCurrentAssignment.subAreaId] : [],
        branch: editingUserCurrentAssignment?.branchId ? [editingUserCurrentAssignment.branchId] : []
      };

      const newAssignmentIds = {
        area: editAreaIds,
        subArea: editSubAreaIds,
        branch: editBranchIds
      };

      // Check if assignments actually changed
      const assignmentChanged =
        JSON.stringify(currentAssignmentIds) !== JSON.stringify(newAssignmentIds);

      if (assignmentChanged) {
        // Remove all old assignments if exist
        if (editingUserCurrentAssignment) {
          try {
            const allAssignments = await userService.getUserAssignments(editingUser.id);
            const activeAssignments = allAssignments.filter(a => a.active);

            for (const assignment of activeAssignments) {
              await userService.deleteUserAssignment(assignment.id);
            }
          } catch (error) {
            console.error("Error removing old assignments:", error);
          }
        }

        // Create new assignments based on selected items
        const assignmentPromises: Promise<any>[] = [];

        // Hierarchical assignment logic for edit mode
        if (editBranchIds.length > 0) {
          // Specific branches selected - assign to these branches only
          editBranchIds.forEach(branchId => {
            const assignRequest: AssignUserRequest = { userId: editingUser.id, branchId };
            assignmentPromises.push(userService.assignUserToHierarchy(assignRequest));
          });
        } else if (editSubAreaIds.length > 0) {
          // Sub-areas selected - assign to the sub-area itself AND ALL branches in these sub-areas
          for (const subAreaId of editSubAreaIds) {
            // First, assign to the sub-area itself
            const subAreaAssignRequest: AssignUserRequest = { userId: editingUser.id, subAreaId };
            assignmentPromises.push(userService.assignUserToHierarchy(subAreaAssignRequest));

            // Get all branches in this sub-area
            const subAreaBranches = branches.filter(branch => branch.subAreaId === subAreaId);
            if (subAreaBranches.length > 0) {
              // Assign to all branches in the sub-area
              subAreaBranches.forEach(branch => {
                const assignRequest: AssignUserRequest = { userId: editingUser.id, branchId: branch.id };
                assignmentPromises.push(userService.assignUserToHierarchy(assignRequest));
              });
            }
          }
        } else if (editAreaIds.length > 0) {
          // Areas selected - assign to the area itself AND ALL sub-areas and ALL branches in these areas
          for (const areaId of editAreaIds) {
            // First, assign to the area itself
            const areaAssignRequest: AssignUserRequest = { userId: editingUser.id, areaId };
            assignmentPromises.push(userService.assignUserToHierarchy(areaAssignRequest));

            // Get all sub-areas in this area
            const areaSubAreas = subAreas.filter(subArea => subArea.areaId === areaId);

            if (areaSubAreas.length > 0) {
              // Assign to all sub-areas themselves
              areaSubAreas.forEach(subArea => {
                const subAreaAssignRequest: AssignUserRequest = { userId: editingUser.id, subAreaId: subArea.id };
                assignmentPromises.push(userService.assignUserToHierarchy(subAreaAssignRequest));
              });

              // Also assign to all branches in these sub-areas
              const areaBranches = branches.filter(branch => branch.areaId === areaId);
              areaBranches.forEach(branch => {
                const assignRequest: AssignUserRequest = { userId: editingUser.id, branchId: branch.id };
                assignmentPromises.push(userService.assignUserToHierarchy(assignRequest));
              });
            }
          }
        }

        if (assignmentPromises.length > 0) {
          await Promise.all(assignmentPromises);
          if (assignmentChanged) {
            showToast(`User updated successfully! Created ${assignmentPromises.length} assignment(s) based on your selection.`, "success");
          }
        } else if (assignmentChanged) {
          showToast("User updated successfully but no assignments were made.", "warning");
        }
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? updatedUser : u)),
      );
      await fetchUsers();
      handleCancelEdit();
      if (!assignmentChanged) {
        showToast("User updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showToast(
        `Error updating user: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const newAssignmentIds = {
    area: editAreaIds,
    subArea: editSubAreaIds,
    branch: editBranchIds
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({ fullName: "", username: "", phone: "" });
    setEditAreaIds([]);
    setEditSubAreaIds([]);
    setEditBranchIds([]);
    setCurrentUserAssignments([]);
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u?.id === userId);
    if (!user) return;

    // Get current active status, default to true if not set
    const isActive = user.active !== undefined ? user.active : (user.enabled !== undefined ? user.enabled : true);
    const action = isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const updatedUser = isActive
        ? await userService.deactivateUser(userId)
        : await userService.activateUser(userId);

      // Update the user in local state
      setUsers(prevUsers =>
        prevUsers.map(u => u?.id === userId ? { ...u, ...updatedUser } : u)
      );

      showToast(`User ${updatedUser.active ? "activated" : "deactivated"} successfully`, "success");
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      showToast(`Failed to ${action} user`, "error");
    }
  };

  const groupedBranches = useMemo(() => {
    const groups: { id: string; label: string; branches: Branch[] }[] = [];

    if (editSubAreaIds.length > 0) {
      editSubAreaIds.forEach((subAreaId) => {
        const label =
          subAreas.find((sub) => sub.id === subAreaId)?.name || `Sub-Area ${subAreaId}`;
        const relatedBranches = branches.filter((branch) => branch.subAreaId === subAreaId);
        if (relatedBranches.length > 0) {
          groups.push({ id: `sub-${subAreaId}`, label, branches: relatedBranches });
        }
      });
    } else if (editAreaIds.length > 0) {
      editAreaIds.forEach((areaId) => {
        const label =
          areas.find((area) => area.id === areaId)?.name || `Area ${areaId}`;
        const relatedBranches = branches.filter((branch) => branch.areaId === areaId);
        if (relatedBranches.length > 0) {
          groups.push({ id: `area-${areaId}`, label, branches: relatedBranches });
        }
      });
    }

    return groups;
  }, [editSubAreaIds, editAreaIds, subAreas, areas, branches]);

  return (
    <BranchreportServiceGuard>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">User Management</h1>
          <p className="text-slate-400">Manage users and assign them to areas, sub-areas, or branches</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-6">
              {editingUser ? "Edit User" : "Create User"}
            </h2>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column - All input fields in single column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editingUser ? editFormData.fullName : formData.fullName}
                      onChange={(e) => editingUser
                        ? setEditFormData({ ...editFormData, fullName: e.target.value })
                        : setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 placeholder-slate-400"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={editingUser ? editFormData.username : formData.username}
                      onChange={(e) => editingUser
                        ? setEditFormData({ ...editFormData, username: e.target.value })
                        : setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 placeholder-slate-400"
                      placeholder="Enter username"
                      required
                      disabled={!!editingUser}
                    />
                    {editingUser && (
                      <p className="text-xs text-slate-400 mt-1">
                        Username cannot be changed
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingUser ? editFormData.phone : formData.phone}
                      onChange={(e) => editingUser
                        ? setEditFormData({ ...editFormData, phone: e.target.value })
                        : setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 placeholder-slate-400"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {(!editingUser || showPassword) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Password {editingUser ? "(leave blank to keep current)" : "*"}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 placeholder-slate-400"
                        placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                        required={!editingUser}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column - Hierarchy Dropdown */}
                <div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-200 mb-3">
                      Assign to Areas, Sub-Areas, or Branches
                    </label>
                    <div className="text-xs text-slate-400 mb-3 space-y-1">
                      <p>• <strong>Area selection:</strong> Access to area + ALL sub-areas + ALL branches in that area</p>
                      <p>• <strong>Sub-area selection:</strong> Access to sub-area + ALL branches in that sub-area</p>
                      <p>• <strong>Branch selection:</strong> Access to only that specific branch</p>
                    </div>
                    <MultiSelectHierarchyDropdown
                      areas={areas}
                      subAreas={availableSubAreas}
                      branches={availableBranches}
                      currentUserAssignments={dropdownAssignments}
                      selectedAreaIds={editingUser ? editAreaIds : selectedAreaIds}
                      selectedSubAreaIds={editingUser ? editSubAreaIds : selectedSubAreaIds}
                      selectedBranchIds={editingUser ? editBranchIds : selectedBranchIds}
                      onAreaChange={editingUser ? setEditAreaIds : setSelectedAreaIds}
                      onSubAreaChange={editingUser ? setEditSubAreaIds : setSelectedSubAreaIds}
                      onBranchChange={editingUser ? setEditBranchIds : setSelectedBranchIds}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Saving..." : (editingUser ? "Update" : "Create")}
                </button>
                {editingUser && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    {!showPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Change Password
                      </button>
                    )}
                  </>
                )}
                {!editingUser && !showPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(false)}
                    className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                  >
                    Hide Password
                  </button>
                )}
              </div>
            </form >
          </div >

          {/* List Section */}
          < div className="bg-slate-800 rounded-lg p-6" >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-100">Users List</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>

            {
              loading ? (
                <div className="text-center py-8">
                  <div className="text-slate-400">Loading users...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-400">{error}</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400">No users found</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user?.id || 'unknown'}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-slate-100">{user?.fullName || 'Unknown'}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${(user?.active !== undefined ? user?.active : (user?.enabled !== undefined ? user?.enabled : true))
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                              }`}>
                              {(user?.active !== undefined ? user?.active : (user?.enabled !== undefined ? user?.enabled : true)) ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-slate-400 text-sm mt-1">
                            <div>Username: {user?.username || 'Unknown'}</div>
                            {(user as any)?.phone && <div>Phone: {(user as any).phone}</div>}
                          </div>
                          <div className="text-slate-500 text-xs mt-2">
                            Created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`px-3 py-1 text-white text-sm rounded transition-colors ${(user?.active !== undefined ? user?.active : (user?.enabled !== undefined ? user?.enabled : true))
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-green-600 hover:bg-green-700"
                              }`}
                          >
                            {(user?.active !== undefined ? user?.active : (user?.enabled !== undefined ? user?.enabled : true)) ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </BranchreportServiceGuard>
  );
}
