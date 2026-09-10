# Intelligence

Arrival and wait estimates use a deterministic capacity/queue fallback that remains available without an LLM. Candidate centres are filtered by crops, status, safe slots, capacity, and farmer eligibility; OR-Tools CP-SAT chooses the minimum weighted travel, wait, congestion, and completion-risk score. Explanations are derived from those score components.
