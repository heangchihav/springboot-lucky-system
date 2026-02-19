import { useState, useEffect } from "react";
import { apiFetch } from "@/services/httpClient";

interface UserInfoCellProps {
  userId: string;
}

const UserInfoCell = ({ userId }: UserInfoCellProps) => {
  const [userInfo, setUserInfo] = useState<{ fullName: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let fullName: string;
        let phone: string;

        if (/^\d+$/.test(userId)) {
          // If it's a user ID, get username first, then get user info
          const usernameResponse = await apiFetch(`/api/users/${userId}/username`, {
            method: "GET",
          });

          if (usernameResponse.ok) {
            const username = await usernameResponse.text();
            // Now get full name and phone using username
            const userInfoResponse = await apiFetch(`/api/users/username/${username}/fullname`, {
              method: "GET",
            });

            if (userInfoResponse.ok) {
              const userData = await userInfoResponse.json();
              fullName = userData.fullName;
              phone = userData.phone;
            } else {
              fullName = userId;
              phone = 'N/A';
            }
          } else {
            fullName = userId;
            phone = 'N/A';
          }
        } else {
          // If it's a username, get user info directly
          const userInfoResponse = await apiFetch(`/api/users/username/${userId}/fullname`, {
            method: "GET",
          });

          if (userInfoResponse.ok) {
            const userData = await userInfoResponse.json();
            fullName = userData.fullName;
            phone = userData.phone;
          } else {
            fullName = userId;
            phone = 'N/A';
          }
        }

        setUserInfo({ fullName, phone });
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setUserInfo({ fullName: userId, phone: 'N/A' });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  if (loading) {
    return <span className="text-sm text-slate-400">Loading...</span>;
  }

  return (
    <span className="text-sm text-slate-400">
      {userInfo?.fullName || userId} • {userInfo?.phone || 'N/A'}
    </span>
  );
};

export default UserInfoCell;
