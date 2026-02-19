import { useState, useEffect } from "react";
import { marketingUserAssignmentService, MarketingUserAssignment } from "@/services/marketingUserAssignmentService";
import { apiFetch } from "@/services/httpClient";

interface SubAreaCellProps {
  createdBy: string;
}

const SubAreaCell = ({ createdBy }: SubAreaCellProps) => {
  const [userAssignments, setUserAssignments] = useState<MarketingUserAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAssignments = async () => {
      try {
        // Check if createdBy is a number (ID) or username
        let userId: number;

        if (/^\d+$/.test(createdBy)) {
          // If it's all digits, treat it as a user ID directly
          userId = parseInt(createdBy, 10);
        } else {
          // If it's a username, get the user ID first
          const userIdResponse = await apiFetch(`/api/users/username/${createdBy}/id`, {
            method: "GET",
          });

          if (!userIdResponse.ok) {
            console.warn(`User not found for username: ${createdBy}`);
            return;
          }

          userId = await userIdResponse.json();
        }

        if (userId) {
          // Then get assignments by user ID
          const assignments = await marketingUserAssignmentService.getUserAssignments(userId);
          setUserAssignments(assignments);
        }
      } catch (error) {
        console.error('Failed to fetch user assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (createdBy) {
      fetchUserAssignments();
    }
  }, [createdBy]);

  const getUserSubAreas = () => {
    const subAreas = userAssignments
      .filter(assignment => assignment.active && assignment.subAreaName)
      .map(assignment => assignment.subAreaName!)
      .filter((subArea): subArea is string => subArea !== undefined);
    return [...new Set(subAreas)]; // Remove duplicates
  };

  if (loading) {
    return (
      <span className="text-sm text-slate-500 animate-pulse">
        Loading...
      </span>
    );
  }

  const subAreas = getUserSubAreas();
  if (subAreas.length === 0) {
    return (
      <span className="text-sm text-slate-400">
        No sub-areas
      </span>
    );
  }

  if (subAreas.length === 1) {
    return (
      <span className="text-sm text-slate-300">
        {subAreas[0]}
      </span>
    );
  }

  return (
    <span className="text-sm text-slate-300">
      <span className="font-medium text-slate-200">Sub-areas:</span>
      <span className="ml-1">
        {subAreas.map((subArea, index) => (
          <span key={index} className="inline-block bg-slate-700/50 rounded px-2 py-1 text-xs mr-1 mb-1">
            {subArea}
          </span>
        ))}
      </span>
    </span>
  );
};

export default SubAreaCell;
