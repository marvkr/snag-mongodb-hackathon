Product Design Requirements (PDR)
Project Name: Snag
Tagline: "Lemme snag that"
Logo Concept: Fish hook or hand grabbing
Brand Voice: Casual, everyday language
Track: Statement Three – Adaptive Retrieval
Hackathon: MongoDB Agentic Orchestration and Collaboration
Primary Use Case: Screenshot-driven intent inference → adaptive retrieval → spatial memory

1. Problem Statement
People screenshot things they care about before they know what they want to do with them.
These screenshots are high-signal, pre-search intent, but today they are dead storage.
Existing systems fail because:
They require explicit queries
They force premature structure like itineraries
They do not adapt retrieval based on accumulated user behavior
They treat images as content, not intent
We want to turn screenshots into living memory that adapts how it retrieves information over time.

2. Goal
Build an agentic, adaptive retrieval system that:
Infers user intent from screenshots
Routes intent into a domain bucket
Changes retrieval strategy based on accumulated signals
Produces a lightweight, serendipitous output artifact
For the demo, artifact is a Google Maps–style bookmark view for travel.

3. User Flow (End to End)
User takes a screenshot on their phone
User shares screenshot to Snag app
System processes screenshot asynchronously
Intent is inferred and routed
Adaptive retrieval runs based on intent and memory
User sees a live map with auto-created bookmarks
No user prompt required.

4. Core User Experience
Primary Screen
Feed of processed screenshots
Each screenshot shows:
Inferred bucket
Confidence score
Short rationale
Travel View (Hero Demo)
Full-screen map view
Pins appear progressively
Auto-generated list name (example: "LA spots you've been saving")
Pins colored by cluster or source
User action is optional. The system leads.

5. Intent Buckets (V1)
Travel (fully implemented)
Shopping (stubbed)
Startup (stubbed)
General (fallback)
Only Travel needs to work end to end for judging.

6. Adaptive Retrieval Design
This is the heart of the project.
Inputs
Screenshot image
OCR text
Visual embeddings
Historical screenshot embeddings
Time and frequency signals
Adaptive Behaviors
Retrieval strategy changes when:
Multiple screenshots reference the same city
Place density crosses a threshold
Ambiguity decreases over time
Examples:
Global place search → city-constrained search
Web page retrieval → map coordinate resolution
Popularity ranking → proximity and cluster density ranking
Single result → grouped neighborhood clusters
This adaptation is persistent, not session-based.

7. Agent Architecture
Router Agent
Input: parsed screenshot data
Output:
bucket_candidates
primary_bucket
confidence
rationale
Travel Agent
Input: router output + structured parse
Responsibilities:
Place extraction
Disambiguation via clustering
Retrieval strategy selection
Artifact generation (map bookmarks)
The agent never sees raw pixels. It operates on structured representations.

8. MongoDB Atlas Role (Critical)
MongoDB Atlas is the system's long-term memory and context engine.
It stores:
Screenshot embeddings (vector search)
Place embeddings
Screenshot → place relationships
Cluster metadata
Retrieval strategies that worked
User-level repetition signals
Atlas enables:
Adaptive retrieval over time
Cross-screenshot reasoning
Durable memory across sessions and restarts
This is not a stateless RAG system.

9. Data Model (Simplified)
Collections
screenshots
embeddings
places
clusters
intent_history
Each object is append-only where possible to preserve evolution.

10. Demo Scenario (Judge-Optimized)
Show 3 screenshots from LA influencers
Click "Process"
Show inferred intent: Travel (0.86)
Jump directly to map view
Pins animate into Silver Lake, Venice, Malibu
Auto-list name appears
Say one line:
"This map didn't come from search. It came from screenshots."

11. Success Criteria
The demo is successful if:
Intent routing is visible and explainable
Retrieval clearly adapts based on multiple screenshots
MongoDB Atlas is obviously core to the system
The output feels lightweight and serendipitous
Judges immediately understand the value

12. Risks and Mitigations
Risk: OCR or entity extraction fails
Mitigation: Hardcode a few demo screenshots with known places
Risk: Too much scope
Mitigation: One bucket, one artifact, one wow moment
Risk: Judges think this is tagging
Mitigation: Explicitly explain retrieval strategy changes

13. Why This Fits Statement Three
This system:
Actively fetches from multimodal sources
Modifies retrieval strategy based on user history
Reorders results using learned signals
Reasons across images, text, and memory
Improves with use
