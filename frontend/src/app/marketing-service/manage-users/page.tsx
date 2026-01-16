"use client";

import React, { useState, useEffect, useMemo } from "react";
import { userService, User, CreateUserRequest } from "@/services/userService";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import { useToast } from "@/components/ui/Toast";
import { serviceService } from "@/services/serviceService";
import { marketingUserService } from "@/services/marketing-service/marketingUserService";
import { marketingUserAssignmentService, MarketingUserAssignment, AssignUserRequest } from "@/services/marketingUserAssignmentService";
import { marketingHierarchyService, MarketingArea, MarketingSubArea, MarketingBranch } from "@/services/marketing-service/marketingHierarchyService";
import { API_BASE_URL } from "@/config/env";

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
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

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
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketingServiceId, setMarketingServiceId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    phone: "",
  });
  const [areas, setAreas] = useState<MarketingArea[]>([]);
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
  const [branches, setBranches] = useState<MarketingBranch[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [selectedSubAreaIds, setSelectedSubAreaIds] = useState<number[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserAssignment, setCurrentUserAssignment] = useState<MarketingUserAssignment | null>(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
  });
  const [editAreaIds, setEditAreaIds] = useState<number[]>([]);
  const [editSubAreaIds, setEditSubAreaIds] = useState<number[]>([]);
  const [editBranchIds, setEditBranchIds] = useState<number[]>([]);
  const [editingUserCurrentAssignment, setEditingUserCurrentAssignment] = useState<MarketingUserAssignment | null>(null);

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredUsers = users.filter((user) => {
    const fullName = (user.fullName ?? "").toLowerCase();
    const username = (user.username ?? "").toLowerCase();
    return (
      fullName.includes(normalizedSearch) || username.includes(normalizedSearch)
    );
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchMarketingServiceId();
    loadHierarchy();
  }, []);

  // Load sub-areas when areas are selected
  useEffect(() => {
    if (selectedAreaIds.length > 0) {
      const loadAllSubAreas = async () => {
        // Load sub-areas for each area in parallel
        await Promise.all(
          selectedAreaIds.map(areaId =>
            marketingHierarchyService.listSubAreas(areaId)
          )
        ).then(results => {
          // Combine all results
          const combined = results.flat();
          // Remove duplicates
          const unique = combined.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
          );
          setSubAreas(unique);
        }).catch(error => {
          console.error("Error loading sub-areas:", error);
        });
      };

      loadAllSubAreas();
    } else {
      setSubAreas([]);
      setSelectedSubAreaIds([]);
    }
  }, [selectedAreaIds]);

  // Load branches when sub-areas are selected
  useEffect(() => {
    if (selectedSubAreaIds.length > 0) {
      const allBranches: MarketingBranch[] = [];
      selectedSubAreaIds.forEach(subAreaId => {
        loadBranchesForSubArea(subAreaId, allBranches);
      });
    } else if (selectedAreaIds.length > 0) {
      const allBranches: MarketingBranch[] = [];
      selectedAreaIds.forEach(areaId => {
        loadBranchesForArea(areaId, allBranches);
      });
    } else {
      setBranches([]);
      setSelectedBranchIds([]);
    }
  }, [selectedSubAreaIds, selectedAreaIds]);

  // Similar for edit mode
  useEffect(() => {
    if (editAreaIds.length > 0) {
      const loadAllSubAreas = async () => {
        // Load sub-areas for each area in parallel
        await Promise.all(
          editAreaIds.map(areaId =>
            marketingHierarchyService.listSubAreas(areaId)
          )
        ).then(results => {
          // Combine all results
          const combined = results.flat();
          // Remove duplicates
          const unique = combined.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
          );
          setSubAreas(unique);
        }).catch(error => {
          console.error("Error loading sub-areas:", error);
        });
      };

      loadAllSubAreas();
    }
  }, [editAreaIds]);

  useEffect(() => {
    if (editSubAreaIds.length > 0) {
      const allBranches: MarketingBranch[] = [];
      editSubAreaIds.forEach(subAreaId => {
        loadBranchesForSubArea(subAreaId, allBranches);
      });
    } else if (editAreaIds.length > 0) {
      const allBranches: MarketingBranch[] = [];
      editAreaIds.forEach(areaId => {
        loadBranchesForArea(areaId, allBranches);
      });
    }
  }, [editSubAreaIds, editAreaIds]);

  const fetchMarketingServiceId = async () => {
    try {
      const marketingService = await serviceService.getServiceByCode("marketing-service");
      setMarketingServiceId(marketingService.id);
    } catch (error) {
      console.error("Error fetching marketing service:", error);
    }
  };

  const toggleSelection = (ids: number[], id: number) => {
    if (ids.includes(id)) {
      return ids.filter((existingId) => existingId !== id);
    }
    return [...ids, id];
  };

  const groupedBranches = useMemo(() => {
    const groups: { id: string; label: string; branches: MarketingBranch[] }[] = [];

    if (selectedSubAreaIds.length > 0) {
      selectedSubAreaIds.forEach((subAreaId) => {
        const label =
          subAreas.find((sub) => sub.id === subAreaId)?.name || `Sub-Area ${subAreaId}`;
        const relatedBranches = branches.filter((branch) => branch.subAreaId === subAreaId);
        if (relatedBranches.length > 0) {
          groups.push({ id: `sub-${subAreaId}`, label, branches: relatedBranches });
        }
      });
    } else if (selectedAreaIds.length > 0) {
      selectedAreaIds.forEach((areaId) => {
        const label = areas.find((area) => area.id === areaId)?.name || `Area ${areaId}`;
        const relatedBranches = branches.filter((branch) => branch.areaId === areaId);
        if (relatedBranches.length > 0) {
          groups.push({ id: `area-${areaId}`, label, branches: relatedBranches });
        }
      });
    }

    return groups;
  }, [selectedAreaIds, selectedSubAreaIds, branches, areas, subAreas]);

  const groupedEditBranches = useMemo(() => {
    const groups: { id: string; label: string; branches: MarketingBranch[] }[] = [];

    if (editSubAreaIds.length > 0) {
      editSubAreaIds.forEach((subAreaId) => {
        const label =
          subAreas.find((sub) => sub.id === subAreaId)?.name || `Sub-Area ${subAreaId}`;
        const relatedBranches = branches.filter((branch) => branch.subAreaId === subAreaId);
        if (relatedBranches.length > 0) {
          groups.push({ id: `edit-sub-${subAreaId}`, label, branches: relatedBranches });
        }
      });
    } else if (editAreaIds.length > 0) {
      editAreaIds.forEach((areaId) => {
        const label = areas.find((area) => area.id === areaId)?.name || `Area ${areaId}`;
        const relatedBranches = branches.filter((branch) => branch.areaId === areaId);
        if (relatedBranches.length > 0) {
          groups.push({ id: `edit-area-${areaId}`, label, branches: relatedBranches });
        }
      });
    }

    return groups;
  }, [editAreaIds, editSubAreaIds, branches, areas, subAreas]);

  const loadSubAreasForArea = async (areaId: number, accumulator: MarketingSubArea[] = []) => {
    try {
      const subAreas = await marketingHierarchyService.listSubAreas(areaId);
      accumulator.push(...subAreas);
      // Don't setSubAreas here - let the caller handle it to avoid race conditions
    } catch (error) {
      console.error(`Error loading sub-areas for area ${areaId}:`, error);
    }
  };

  const loadBranchesForSubArea = async (subAreaId: number, accumulator: MarketingBranch[] = []) => {
    try {
      const branches = await marketingHierarchyService.listBranches({ subAreaId });
      accumulator.push(...branches);
      setBranches(prev => {
        const combined = [...prev, ...branches];
        // Remove duplicates
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        return unique;
      });
    } catch (error) {
      console.error(`Error loading branches for sub-area ${subAreaId}:`, error);
    }
  };

  const loadBranchesForArea = async (areaId: number, accumulator: MarketingBranch[] = []) => {
    try {
      const branches = await marketingHierarchyService.listBranches({ areaId });
      accumulator.push(...branches);
      setBranches(prev => {
        const combined = [...prev, ...branches];
        // Remove duplicates
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        return unique;
      });
    } catch (error) {
      console.error(`Error loading branches for area ${areaId}:`, error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users directly from marketing service
      console.log("Fetching users from marketing service...");
      const usersData = await marketingUserService.getMarketingUsers();
      console.log("Marketing users fetched:", usersData.length);

      setUsers(usersData);
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        serviceIds: marketingServiceId ? [marketingServiceId] : undefined,
      };

      const newUser = await userService.createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      setFormData({
        fullName: "",
        username: "",
        password: "",
        phone: "",
      });
      // Clear selection after user creation
      setSelectedAreaIds([]);
      setSelectedSubAreaIds([]);
      setSelectedBranchIds([]);

      // Assign user to multiple locations based on selected items
      const assignmentPromises: Promise<any>[] = [];

      // Hierarchical assignment logic
      if (selectedBranchIds.length > 0) {
        // Specific branches selected - assign to these branches only
        selectedBranchIds.forEach(branchId => {
          const assignRequest: AssignUserRequest = { userId: newUser.id, branchId };
          assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
        });
      } else if (selectedSubAreaIds.length > 0) {
        // Sub-areas selected - assign to ALL branches in these sub-areas
        for (const subAreaId of selectedSubAreaIds) {
          // Get all branches in this sub-area
          const subAreaBranches = branches.filter(branch => branch.subAreaId === subAreaId);
          if (subAreaBranches.length > 0) {
            subAreaBranches.forEach(branch => {
              const assignRequest: AssignUserRequest = { userId: newUser.id, branchId: branch.id };
              assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
            });
          } else {
            // If no branches in sub-area, assign to sub-area itself
            const assignRequest: AssignUserRequest = { userId: newUser.id, subAreaId };
            assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
          }
        }
      } else if (selectedAreaIds.length > 0) {
        // Areas selected - assign to ALL sub-areas and ALL branches in these areas
        for (const areaId of selectedAreaIds) {
          // Get all sub-areas in this area
          const areaSubAreas = subAreas.filter(subArea => subArea.areaId === areaId);

          if (areaSubAreas.length > 0) {
            // Assign to all sub-areas
            areaSubAreas.forEach(subArea => {
              const assignRequest: AssignUserRequest = { userId: newUser.id, subAreaId: subArea.id };
              assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
            });

            // Also assign to all branches in these sub-areas
            const areaBranches = branches.filter(branch => branch.areaId === areaId);
            areaBranches.forEach(branch => {
              const assignRequest: AssignUserRequest = { userId: newUser.id, branchId: branch.id };
              assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
            });
          } else {
            // If no sub-areas in area, assign to area itself
            const assignRequest: AssignUserRequest = { userId: newUser.id, areaId };
            assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
          }
        }
      }

      if (assignmentPromises.length > 0) {
        await Promise.all(assignmentPromises);
        alert(`User created successfully! Created ${assignmentPromises.length} assignment(s) based on your selection.`);
      } else {
        alert("User created successfully but no assignments were made.");
      }
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

  const loadHierarchy = async () => {
    try {
      const fetchedUserId = await fetchAndCacheUserId();
      const currentUserId = fetchedUserId ?? getStoredUserId();

      const allAreas = await marketingHierarchyService.listAreas();
      setAreas(allAreas.filter((a: MarketingArea) => a.active));

      if (currentUserId) {
        try {
          const assignments = await marketingUserAssignmentService.getUserAssignments(currentUserId);
          const activeAssignment = assignments.find(a => a.active);

          if (activeAssignment) {
            setCurrentUserAssignment(activeAssignment);

            // Set selections based on the current user's assignment
            if (activeAssignment.assignmentType === "AREA" && activeAssignment.areaId) {
              setSelectedAreaIds([activeAssignment.areaId]);
            } else if (activeAssignment.assignmentType === "SUB_AREA" && activeAssignment.subAreaId) {
              setSelectedAreaIds(activeAssignment.areaId ? [activeAssignment.areaId] : []);
              setSelectedSubAreaIds([activeAssignment.subAreaId]);
            } else if (activeAssignment.assignmentType === "BRANCH" && activeAssignment.branchId) {
              setSelectedAreaIds(activeAssignment.areaId ? [activeAssignment.areaId] : []);
              setSelectedSubAreaIds(activeAssignment.subAreaId ? [activeAssignment.subAreaId] : []);
              setSelectedBranchIds([activeAssignment.branchId]);
            }
          }
        } catch (assignmentError) {
          console.error("Error loading current user assignments:", assignmentError);
        }
      }
    } catch (error) {
      console.error("Error loading hierarchy:", error);
    }
  };

  const loadUserAssignment = async (userId: number) => {
    try {
      const assignments = await marketingUserAssignmentService.getUserAssignments(userId);
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
          // Get parent area and sub-area IDs for branches
          const parentAreaIds = activeAssignments
            .filter(a => a.assignmentType === "BRANCH" && a.areaId)
            .map(a => a.areaId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // unique
          const parentSubAreaIds = activeAssignments
            .filter(a => a.assignmentType === "BRANCH" && a.subAreaId)
            .map(a => a.subAreaId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // unique
          setEditAreaIds(parentAreaIds);
          setEditSubAreaIds(parentSubAreaIds);
          setEditBranchIds(branchIds);
        }

        // Set the first assignment as the current one for compatibility
        setEditingUserCurrentAssignment(activeAssignments[0]);
      } else {
        setEditingUserCurrentAssignment(null);
        setEditAreaIds([]);
        setEditSubAreaIds([]);
        setEditBranchIds([]);
      }
    } catch (error) {
      console.error("Error loading user assignment:", error);
      setEditingUserCurrentAssignment(null);
      setEditAreaIds([]);
      setEditSubAreaIds([]);
      setEditBranchIds([]);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const updatedUser = user.active
        ? await userService.deactivateUser(userId)
        : await userService.activateUser(userId);

      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
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

  // Edit user handlers
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      username: user.username,
      phone: user.phone || "",
    });
    loadUserAssignment(user.id);
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
    setEditingUserCurrentAssignment(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updatedUser = await userService.updateUser(editingUser.id, {
        fullName: editFormData.fullName,
        phone: editFormData.phone || undefined,
        // Note: Not updating serviceIds to keep user in current service
      });

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
            const allAssignments = await marketingUserAssignmentService.getUserAssignments(editingUser.id);
            const activeAssignments = allAssignments.filter(a => a.active);

            for (const assignment of activeAssignments) {
              await marketingUserAssignmentService.removeAssignment(
                assignment.id,
                editingUser.id
              );
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
            assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
          });
        } else if (editSubAreaIds.length > 0) {
          // Sub-areas selected - assign to ALL branches in these sub-areas
          for (const subAreaId of editSubAreaIds) {
            // Get all branches in this sub-area
            const subAreaBranches = branches.filter(branch => branch.subAreaId === subAreaId);
            if (subAreaBranches.length > 0) {
              subAreaBranches.forEach(branch => {
                const assignRequest: AssignUserRequest = { userId: editingUser.id, branchId: branch.id };
                assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
              });
            } else {
              // If no branches in sub-area, assign to sub-area itself
              const assignRequest: AssignUserRequest = { userId: editingUser.id, subAreaId };
              assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
            }
          }
        } else if (editAreaIds.length > 0) {
          // Areas selected - assign to ALL sub-areas and ALL branches in these areas
          for (const areaId of editAreaIds) {
            // Get all sub-areas in this area
            const areaSubAreas = subAreas.filter(subArea => subArea.areaId === areaId);

            if (areaSubAreas.length > 0) {
              // Assign to all sub-areas
              areaSubAreas.forEach(subArea => {
                const assignRequest: AssignUserRequest = { userId: editingUser.id, subAreaId: subArea.id };
                assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
              });

              // Also assign to all branches in these sub-areas
              const areaBranches = branches.filter(branch => branch.areaId === areaId);
              areaBranches.forEach(branch => {
                const assignRequest: AssignUserRequest = { userId: editingUser.id, branchId: branch.id };
                assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
              });
            } else {
              // If no sub-areas in area, assign to area itself
              const assignRequest: AssignUserRequest = { userId: editingUser.id, areaId };
              assignmentPromises.push(marketingUserAssignmentService.assignUser(assignRequest));
            }
          }
        }

        if (assignmentPromises.length > 0) {
          await Promise.all(assignmentPromises);
          if (assignmentChanged) {
            alert(`User updated successfully! Created ${assignmentPromises.length} assignment(s) based on your selection.`);
          }
        } else if (assignmentChanged) {
          alert("User updated successfully but no assignments were made.");
        }
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? updatedUser : u)),
      );
      await fetchUsers();
      cancelEdit();
      if (assignmentChanged) {
        await loadUserAssignment(editingUser.id);
      }
      if (!assignmentChanged) {
        alert("User updated successfully!");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert(
        `Error updating user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Marketing Service · Manage Users
        </h2>
        <p className="text-slate-300">
          Manage marketing user accounts and area/branch assignments.
        </p>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">
                  Area(s)
                </label>
                <span className="text-xs text-slate-400">
                  {selectedAreaIds.length} selected
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                {areas.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-400">
                    No active areas available.
                  </p>
                )}
                {areas.map((area) => {
                  const checked = selectedAreaIds.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition hover:bg-slate-700/60 ${checked ? "bg-slate-700/60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedAreaIds((prev) => toggleSelection(prev, area.id))
                        }
                        className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                      />
                      <span className="text-sm text-white">{area.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Selecting areas only will assign the user to ALL sub-areas and branches within those areas.
              </p>
            </div>

            {selectedAreaIds.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">
                    Sub-Area(s) (Optional)
                  </label>
                  <span className="text-xs text-slate-400">
                    {selectedSubAreaIds.length} selected
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                  {subAreas.length === 0 && (
                    <p className="px-3 py-2 text-sm text-slate-400">
                      Select an area to view available sub-areas.
                    </p>
                  )}
                  {subAreas.map((subArea) => {
                    const checked = selectedSubAreaIds.includes(subArea.id);
                    return (
                      <label
                        key={subArea.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition hover:bg-slate-700/60 ${checked ? "bg-slate-700/60" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedSubAreaIds((prev) => toggleSelection(prev, subArea.id))
                          }
                          className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-sm text-white">{subArea.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Selecting sub-areas only will assign the user to ALL branches within those sub-areas.
                </p>
              </div>
            )}

            {selectedAreaIds.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">
                    Branch(es)
                  </label>
                  <span className="text-xs text-slate-400">
                    {selectedBranchIds.length} selected
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                  {groupedBranches.length === 0 && (
                    <p className="px-3 py-2 text-sm text-slate-400">
                      Select at least one area or sub-area to view available branches.
                    </p>
                  )}
                  {groupedBranches.map((group) => (
                    <div key={group.id} className="px-3 py-2 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {group.label}
                      </p>
                      <div className="space-y-2">
                        {group.branches.map((branch) => {
                          const checked = selectedBranchIds.includes(branch.id);
                          return (
                            <label
                              key={branch.id}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-700/60 ${checked ? "bg-slate-700/60 border border-blue-500/40" : "border border-transparent"}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedBranchIds((prev) => toggleSelection(prev, branch.id))
                                }
                                className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                              />
                              <div>
                                <p className="text-sm text-white">{branch.name}</p>
                                <p className="text-xs text-slate-400">
                                  Code: {branch.code || "N/A"}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the branches that this user should manage.
                </p>
              </div>
            )}

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
            <PermissionGuard
              permission="user.create"
              serviceContext="marketing-service"
              fallback={
                <button
                  type="button"
                  disabled
                  className="px-6 py-2 bg-gray-600 text-gray-400 rounded-md cursor-not-allowed"
                  title="You don't have permission to create users"
                >
                  Create User (No Permission)
                </button>
              }
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </PermissionGuard>
          </div>
        </form>
      </div>

      {/* Edit User Form */}
      {editingUser && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">Edit User</h3>
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


              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">
                    Area(s)
                  </label>
                  <span className="text-xs text-slate-400">{editAreaIds.length} selected</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                  {areas.length === 0 && (
                    <p className="px-3 py-2 text-sm text-slate-400">No active areas available.</p>
                  )}
                  {areas.map((area) => {
                    const checked = editAreaIds.includes(area.id);
                    return (
                      <label
                        key={area.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${checked ? "bg-slate-700/60" : "hover:bg-slate-700/60"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setEditAreaIds((prev) => toggleSelection(prev, area.id))}
                          className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-sm text-white">{area.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Selecting areas only will assign the user to ALL sub-areas and branches within those areas.
                </p>
              </div>

              {editAreaIds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-300">
                      Sub-Area(s) (Optional)
                    </label>
                    <span className="text-xs text-slate-400">{editSubAreaIds.length} selected</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                    {subAreas.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">Select an area to view sub-areas.</p>
                    )}
                    {subAreas.map((subArea) => {
                      const checked = editSubAreaIds.includes(subArea.id);
                      return (
                        <label
                          key={subArea.id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${checked ? "bg-slate-700/60" : "hover:bg-slate-700/60"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setEditSubAreaIds((prev) => toggleSelection(prev, subArea.id))}
                            className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                          />
                          <span className="text-sm text-white">{subArea.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecting sub-areas only will assign the user to ALL branches within those sub-areas.
                  </p>
                </div>
              )}

              {editAreaIds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-300">
                      Branch(es)
                    </label>
                    <span className="text-xs text-slate-400">{editBranchIds.length} selected</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                    {groupedEditBranches.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">Select an area or sub-area first.</p>
                    )}
                    {groupedEditBranches.map((group) => (
                      <div key={group.id} className="px-3 py-2 space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {group.label}
                        </p>
                        <div className="space-y-2">
                          {group.branches.map((branch) => {
                            const checked = editBranchIds.includes(branch.id);
                            return (
                              <label
                                key={branch.id}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${checked ? "bg-slate-700/60 border border-blue-500/40" : "hover:bg-slate-700/60 border border-transparent"}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => setEditBranchIds((prev) => toggleSelection(prev, branch.id))}
                                  className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                                />
                                <div>
                                  <p className="text-sm text-white">{branch.name}</p>
                                  <p className="text-xs text-slate-400">Code: {branch.code || "N/A"}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose the branches that this user should cover.
                  </p>
                </div>
              )}
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

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-slate-400">Loading users...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
              <button
                onClick={fetchUsers}
                className="ml-auto text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Created Date
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-slate-400"
                    >
                      {searchTerm
                        ? "No users found matching your search."
                        : "No users available."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.phone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <PermissionGuard
                            permission="user.edit"
                            serviceContext="marketing-service"
                            fallback={
                              <button
                                disabled
                                className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium cursor-not-allowed"
                                title="You don't have permission to edit users"
                              >
                                Edit
                              </button>
                            }
                          >
                            <button
                              onClick={() => startEditUser(user)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                          </PermissionGuard>
                          <PermissionGuard
                            permission="user.edit"
                            serviceContext="marketing-service"
                            fallback={
                              <button
                                disabled
                                className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium cursor-not-allowed"
                                title="You don't have permission to change user status"
                              >
                                {user.active ? "Deactivate" : "Activate"}
                              </button>
                            }
                          >
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${user.active
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                                }`}
                            >
                              {user.active ? "Deactivate" : "Activate"}
                            </button>
                          </PermissionGuard>
                          <PermissionGuard
                            permission="user.delete"
                            serviceContext="marketing-service"
                            fallback={
                              <button
                                disabled
                                className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium cursor-not-allowed"
                                title="You don't have permission to delete users"
                              >
                                Delete
                              </button>
                            }
                          >
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
