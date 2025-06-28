import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { mentorAPI, matchRequestAPI, User } from "../lib/api";

export default function Mentors() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [searchSkill, setSearchSkill] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestMessages, setRequestMessages] = useState<{
    [key: number]: string;
  }>({});
  const [sendingRequest, setSendingRequest] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "mentee") return;
    fetchMentors();
  }, [user, searchSkill, sortBy]);

  const fetchMentors = async () => {
    try {
      const params: any = {};
      if (searchSkill) params.skill = searchSkill;
      if (sortBy) params.order_by = sortBy;

      const response = await mentorAPI.getMentors(params);
      setMentors(response.data);
    } catch (error) {
      console.error("Failed to fetch mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (mentorId: number) => {
    if (!user) return;

    setSendingRequest(mentorId);
    try {
      await matchRequestAPI.sendRequest({
        mentorId,
        menteeId: user.id,
        message: requestMessages[mentorId] || "",
      });

      // Clear message and show success
      setRequestMessages((prev) => ({ ...prev, [mentorId]: "" }));
      alert("매칭 요청을 보냈습니다!");
    } catch (error: any) {
      alert(error.response?.data?.error || "요청 전송에 실패했습니다.");
    } finally {
      setSendingRequest(null);
    }
  };

  if (user?.role !== "mentee") {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">멘티만 이용할 수 있는 페이지입니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">멘토 찾기</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            id="search"
            type="text"
            placeholder="기술 스택으로 검색..."
            className="input"
            value={searchSkill}
            onChange={(e) => setSearchSkill(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            id="name"
            onClick={() => setSortBy(sortBy === "name" ? "" : "name")}
            className={`btn ${
              sortBy === "name" ? "btn-primary" : "btn-secondary"
            }`}
          >
            이름순
          </button>
          <button
            id="skill"
            onClick={() => setSortBy(sortBy === "skill" ? "" : "skill")}
            className={`btn ${
              sortBy === "skill" ? "btn-primary" : "btn-secondary"
            }`}
          >
            스킬순
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {mentors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">검색 결과가 없습니다.</p>
            </div>
          ) : (
            mentors.map((mentor) => (
              <div key={mentor.id} className="mentor card">
                <div className="flex items-start space-x-4">
                  <img
                    className="h-16 w-16 rounded-full object-cover"
                    src={mentor.profile.imageUrl}
                    alt={mentor.profile.name || "멘토"}
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {mentor.profile.name || "이름 없음"}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {mentor.profile.bio || "소개가 없습니다."}
                    </p>

                    {mentor.profile.skills &&
                      mentor.profile.skills.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {mentor.profile.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="mt-4">
                      <textarea
                        id="message"
                        data-mentor-id={mentor.id}
                        data-testid={`message-${mentor.id}`}
                        placeholder="매칭 요청 메시지를 입력하세요..."
                        className="textarea text-sm"
                        rows={2}
                        value={requestMessages[mentor.id] || ""}
                        onChange={(e) =>
                          setRequestMessages((prev) => ({
                            ...prev,
                            [mentor.id]: e.target.value,
                          }))
                        }
                      />

                      <button
                        id="request"
                        onClick={() => handleSendRequest(mentor.id)}
                        disabled={sendingRequest === mentor.id}
                        className="btn btn-primary mt-2 text-sm disabled:opacity-50"
                      >
                        {sendingRequest === mentor.id
                          ? "요청 중..."
                          : "매칭 요청"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
