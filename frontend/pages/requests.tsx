import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { matchRequestAPI, MatchRequest } from "../lib/api";

export default function Requests() {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      if (user?.role === "mentor") {
        const response = await matchRequestAPI.getIncomingRequests();
        setIncomingRequests(response.data);
      } else if (user?.role === "mentee") {
        const response = await matchRequestAPI.getOutgoingRequests();
        setOutgoingRequests(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await matchRequestAPI.acceptRequest(requestId);
      fetchRequests(); // Refresh list
    } catch (error: any) {
      alert(error.response?.data?.error || "요청 수락에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await matchRequestAPI.rejectRequest(requestId);
      fetchRequests(); // Refresh list
    } catch (error: any) {
      alert(error.response?.data?.error || "요청 거절에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await matchRequestAPI.cancelRequest(requestId);
      fetchRequests(); // Refresh list
    } catch (error: any) {
      alert(error.response?.data?.error || "요청 취소에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "accepted":
        return "수락됨";
      case "rejected":
        return "거절됨";
      case "cancelled":
        return "취소됨";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">요청 관리</h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {user.role === "mentor" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                받은 요청
              </h2>
              {incomingRequests.length === 0 ? (
                <div className="card text-center text-gray-600">
                  받은 요청이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              멘티 ID: {request.menteeId}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getStatusText(request.status)}
                            </span>
                          </div>

                          {request.message && (
                            <div className="mt-2">
                              <p
                                className="request-message text-gray-700"
                                mentee={request.menteeId.toString()}
                              >
                                "{request.message}"
                              </p>
                            </div>
                          )}
                        </div>

                        {request.status === "pending" && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              id="accept"
                              onClick={() => handleAccept(request.id)}
                              disabled={actionLoading === request.id}
                              className="btn btn-primary text-sm disabled:opacity-50"
                            >
                              수락
                            </button>
                            <button
                              id="reject"
                              onClick={() => handleReject(request.id)}
                              disabled={actionLoading === request.id}
                              className="btn btn-danger text-sm disabled:opacity-50"
                            >
                              거절
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === "mentee" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                보낸 요청
              </h2>
              {outgoingRequests.length === 0 ? (
                <div className="card text-center text-gray-600">
                  보낸 요청이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {outgoingRequests.map((request) => (
                    <div key={request.id} className="card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              멘토 ID: {request.mentorId}
                            </span>
                            <span
                              id="request-status"
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getStatusText(request.status)}
                            </span>
                          </div>
                        </div>

                        {request.status === "pending" && (
                          <button
                            onClick={() => handleCancel(request.id)}
                            disabled={actionLoading === request.id}
                            className="btn btn-secondary text-sm disabled:opacity-50 ml-4"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
