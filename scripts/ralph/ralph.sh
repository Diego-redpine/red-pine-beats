#!/bin/bash

# RALPH - Red Pine Bug Fix Mission
# Autonomous AI Developer Script

echo "╔═══════════════════════════════════════════╗"
echo "║    RALPH - Bug Fix Mission v1.0           ║"
echo "║         Autonomous Build Mode             ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Change to project directory
cd ~/Downloads/red-pine-beats || exit 1

echo "📁 Project: $(pwd)"
echo "📋 PRD: scripts/ralph/prd.json"
echo "📊 Stories: 67"
echo "🎯 Target: Comprehensive bug fixes"
echo ""
echo "Previous Mission: Site Editor (100 stories) ✅"
echo "Current Mission: Bug Fixes & Improvements"
echo ""
echo "Starting Ralph..."
echo ""

# Run Claude Code in autonomous mode
claude --dangerously-skip-permissions <<'PROMPT'
You are Ralph, an autonomous AI developer. 

YOUR MISSION: Fix bugs and implement improvements for Red Pine by completing 67+ user stories.

CONTEXT: You previously built a complete site editor (100 stories). Some components from that work may be reusable. Always check if features already exist before implementing.

INSTRUCTIONS:
1. Read scripts/ralph/prompt.md for detailed instructions
2. Read scripts/ralph/prd.json for all user stories
3. Read scripts/ralph/progress.txt for context and patterns

WORKFLOW:
- Work through stories sequentially by priority (0-67)
- For each story:
  * VERIFY FIRST: Check if feature already exists
  * If working: Mark passes=true and skip
  * If broken/missing: Implement the feature
  * Test it works
  * Update prd.json: "passes": true
  * Log progress in progress.txt
- Pay special attention to DEBUG checkpoint stories
- Do NOT skip any stories without verification
- Do NOT create duplicates of existing functionality
- Fix errors immediately

CRITICAL DEBUG CHECKPOINTS:
- Story 11 (DEBUG-001): Review critical fixes
- Story 22 (DEBUG-002): Review design system
- Story 30 (DEBUG-003): Review upload flow
- Story 41 (DEBUG-004): Review settings
- Story 55 (DEBUG-005): Review features and polish

VERIFICATION IS CRITICAL:
- Check if site editor already has: custom dropdowns, checkbox styles, toasts, auto-save
- Reuse existing components instead of duplicating
- Consolidate similar functionality
- Remove duplicate code at debug checkpoints

When ALL stories are complete (all "passes": true), respond with:
<promise>COMPLETE</promise>

START NOW with story #0 (CLEANUP-000) - file cleanup must run FIRST.

Work autonomously. Don't stop. Ship code.
PROMPT

# Check completion status
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║         RALPH EXECUTION COMPLETE          ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Count completed stories
completed=$(grep -c '"passes": true' scripts/ralph/prd.json)
total=67

echo "✅ Stories completed: $completed/$total"
echo "📝 Check scripts/ralph/progress.txt for details"
echo ""

if [ "$completed" -eq "$total" ]; then
    echo "🎉 ALL STORIES COMPLETE! 🎉"
    echo "🚀 Ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "1. Review the changes"
    echo "2. Run manual database migrations (check progress.txt)"
    echo "3. Test all features"
    echo "4. Deploy to Netlify"
else
    echo "⚠️  Some stories incomplete"
    echo "📊 Progress: $(($completed * 100 / $total))%"
    echo ""
    echo "Check scripts/ralph/prd.json for remaining stories"
fi

echo ""
echo "Done! 🏁"
