import express, { Request, Response } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { run, get, all } from "../database/init";
import { MatchRequest } from "../types";

const router = express.Router();

// Send match request (mentee only)
router.post(
  "/match-requests",
  authenticateToken,
  requireRole("mentee"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { mentorId, menteeId, message } = req.body;
      const userId = req.user!.id; // 토큰에서 추출한 사용자 ID

      console.log(
        `Creating match request: mentorId=${mentorId}, menteeId=${menteeId}, message="${message}", userId=${userId}`
      );

      // menteeId가 토큰의 사용자 ID와 일치하는지 검증
      if (!menteeId) {
        console.log("Validation failed: Mentee ID is required");
        res.status(400).json({ error: "Mentee ID is required" });
        return;
      }

      const parsedMenteeId = parseInt(menteeId, 10);
      if (isNaN(parsedMenteeId) || parsedMenteeId <= 0) {
        console.log(`Validation failed: Invalid mentee ID - ${menteeId}`);
        res.status(400).json({ error: "Valid mentee ID is required" });
        return;
      }

      if (parsedMenteeId !== userId) {
        console.log(
          `Validation failed: Mentee ID ${parsedMenteeId} does not match token user ID ${userId}`
        );
        res
          .status(400)
          .json({ error: "Mentee ID must match authenticated user" });
        return;
      }

      // Enhanced validation for mentorId
      if (!mentorId) {
        console.log("Validation failed: Mentor ID is required");
        res.status(400).json({ error: "Mentor ID is required" });
        return;
      }

      const parsedMentorId = parseInt(mentorId, 10);
      if (isNaN(parsedMentorId) || parsedMentorId <= 0) {
        console.log(`Validation failed: Invalid mentor ID - ${mentorId}`);
        res.status(400).json({ error: "Valid mentor ID is required" });
        return;
      }

      // Validate message - allow empty message but not null/undefined
      if (message === null || message === undefined) {
        console.log("Validation failed: Message is required");
        res.status(400).json({ error: "Message is required" });
        return;
      }

      // Validate message length if provided
      if (message && message.length > 500) {
        console.log(
          `Validation failed: Message too long - ${message.length} characters`
        );
        res.status(400).json({ error: "Message cannot exceed 500 characters" });
        return;
      }

      // Check if mentor exists and is actually a mentor
      const mentor = await get(
        'SELECT * FROM users WHERE id = ? AND role = "mentor"',
        [parsedMentorId]
      );
      if (!mentor) {
        console.log(
          `Validation failed: Mentor not found - ID ${parsedMentorId}`
        );
        res.status(400).json({ error: "Mentor not found" });
        return;
      }

      // Check if request already exists - if it does and is cancelled/rejected, allow recreation
      const existingRequest = await get(
        "SELECT * FROM match_requests WHERE mentor_id = ? AND mentee_id = ?",
        [parsedMentorId, parsedMenteeId]
      );
      if (existingRequest) {
        console.log(`Found existing request: status=${existingRequest.status}`);
        // If request exists and is pending or accepted, don't allow duplicate
        if (
          existingRequest.status === "pending" ||
          existingRequest.status === "accepted"
        ) {
          console.log(
            "Validation failed: Request already exists with pending/accepted status"
          );
          res.status(400).json({ error: "Request already exists" });
          return;
        }
        // If request was cancelled or rejected, delete the old one to allow new request
        if (
          existingRequest.status === "cancelled" ||
          existingRequest.status === "rejected"
        ) {
          console.log(
            `Deleting old ${existingRequest.status} request to allow new one`
          );
          await run("DELETE FROM match_requests WHERE id = ?", [
            existingRequest.id,
          ]);
        }
      }

      // Check if mentee has pending request with a different mentor
      const pendingRequest = await get(
        'SELECT * FROM match_requests WHERE mentee_id = ? AND status = "pending" AND mentor_id != ?',
        [parsedMenteeId, parsedMentorId]
      );
      if (pendingRequest) {
        console.log(
          `Validation failed: User has pending request with mentor ${pendingRequest.mentor_id}`
        );
        res.status(400).json({
          error: "You already have a pending request with another mentor",
        });
        return;
      }

      // Create match request
      const result = await run(
        'INSERT INTO match_requests (mentor_id, mentee_id, message, status) VALUES (?, ?, ?, "pending")',
        [parsedMentorId, parsedMenteeId, message]
      );

      const newRequest = (await get(
        "SELECT * FROM match_requests WHERE id = ?",
        [result.lastID]
      )) as MatchRequest;

      console.log(`Successfully created match request: ID=${newRequest.id}`);

      res.status(201).json({
        id: newRequest.id,
        mentorId: newRequest.mentor_id,
        menteeId: newRequest.mentee_id,
        message: newRequest.message,
        status: newRequest.status,
      });
    } catch (error) {
      console.error("Send match request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get incoming requests (mentor only)
router.get(
  "/match-requests/incoming",
  authenticateToken,
  requireRole("mentor"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const requests = (await all(
        "SELECT * FROM match_requests WHERE mentor_id = ? ORDER BY created_at DESC",
        [userId]
      )) as MatchRequest[];

      const requestList = requests.map((request) => ({
        id: request.id,
        mentorId: request.mentor_id,
        menteeId: request.mentee_id,
        message: request.message,
        status: request.status,
      }));

      res.json(requestList);
    } catch (error) {
      console.error("Get incoming requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get outgoing requests (mentee only)
router.get(
  "/match-requests/outgoing",
  authenticateToken,
  requireRole("mentee"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const requests = (await all(
        "SELECT * FROM match_requests WHERE mentee_id = ? ORDER BY created_at DESC",
        [userId]
      )) as MatchRequest[];

      const requestList = requests.map((request) => ({
        id: request.id,
        mentorId: request.mentor_id,
        menteeId: request.mentee_id,
        status: request.status,
      }));

      res.json(requestList);
    } catch (error) {
      console.error("Get outgoing requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Accept request (mentor only)
router.put(
  "/match-requests/:id/accept",
  authenticateToken,
  requireRole("mentor"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = req.params.id;
      const userId = req.user!.id;

      if (!requestId) {
        res.status(400).json({ error: "Request ID is required" });
        return;
      }

      // Get the request
      const request = (await get(
        "SELECT * FROM match_requests WHERE id = ? AND mentor_id = ?",
        [requestId, userId]
      )) as MatchRequest;

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      // Check if mentor already has accepted request
      const acceptedRequest = await get(
        'SELECT * FROM match_requests WHERE mentor_id = ? AND status = "accepted"',
        [userId]
      );
      if (acceptedRequest && acceptedRequest.id !== parseInt(requestId)) {
        res.status(400).json({ error: "You already have an accepted request" });
        return;
      }

      // Accept the request
      await run(
        'UPDATE match_requests SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [requestId]
      );

      // Reject all other pending requests for this mentor
      await run(
        'UPDATE match_requests SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE mentor_id = ? AND id != ? AND status = "pending"',
        [userId, requestId]
      );

      const updatedRequest = (await get(
        "SELECT * FROM match_requests WHERE id = ?",
        [requestId]
      )) as MatchRequest;

      res.json({
        id: updatedRequest.id,
        mentorId: updatedRequest.mentor_id,
        menteeId: updatedRequest.mentee_id,
        message: updatedRequest.message,
        status: updatedRequest.status,
      });
    } catch (error) {
      console.error("Accept request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Reject request (mentor only)
router.put(
  "/match-requests/:id/reject",
  authenticateToken,
  requireRole("mentor"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = req.params.id;
      const userId = req.user!.id;

      // Get the request
      const request = (await get(
        "SELECT * FROM match_requests WHERE id = ? AND mentor_id = ?",
        [requestId, userId]
      )) as MatchRequest;

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      // Reject the request
      await run(
        'UPDATE match_requests SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [requestId]
      );

      const updatedRequest = (await get(
        "SELECT * FROM match_requests WHERE id = ?",
        [requestId]
      )) as MatchRequest;

      res.json({
        id: updatedRequest.id,
        mentorId: updatedRequest.mentor_id,
        menteeId: updatedRequest.mentee_id,
        message: updatedRequest.message,
        status: updatedRequest.status,
      });
    } catch (error) {
      console.error("Reject request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Cancel request (mentee only)
router.delete(
  "/match-requests/:id",
  authenticateToken,
  requireRole("mentee"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = req.params.id;
      const userId = req.user!.id;

      // Get the request
      const request = (await get(
        "SELECT * FROM match_requests WHERE id = ? AND mentee_id = ?",
        [requestId, userId]
      )) as MatchRequest;

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      // Cancel the request
      await run(
        'UPDATE match_requests SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [requestId]
      );

      const updatedRequest = (await get(
        "SELECT * FROM match_requests WHERE id = ?",
        [requestId]
      )) as MatchRequest;

      res.status(200).json({
        id: updatedRequest.id,
        mentorId: updatedRequest.mentor_id,
        menteeId: updatedRequest.mentee_id,
        message: updatedRequest.message,
        status: updatedRequest.status,
      });
    } catch (error) {
      console.error("Cancel request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
