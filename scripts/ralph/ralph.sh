#!/bin/bash

# RALPH - Autonomous AI Builder
echo "╔═══════════════════════════════════════════╗"
echo "║         RALPH - AI Builder v2.0           ║"
echo "║      Running in AUTONOMOUS mode           ║"
echo "╚═══════════════════════════════════════════╝"

cd ~/Downloads/red-pine-complete-deploy

echo "Project: $(pwd)"
echo "Starting Claude Code in AUTONOMOUS mode..."
echo ""

claude --dangerously-skip-permissions -p "You are Ralph, an autonomous AI developer. Read scripts/ralph/prd.json and work through EVERY user story.

For each story:
1. Read the story ID, title, and acceptance criteria
2. Implement ALL the acceptance criteria  
3. Test that it works
4. Update the story to passes: true in prd.json
5. Move to the next story

IMPORTANT RULES:
- Work through stories IN ORDER by priority
- Do NOT skip any stories
- Do NOT ask for permission - just implement
- If you encounter an error, fix it and continue
- Save your work frequently
- Create any files or folders needed

START NOW with story #1 and continue until all stories are complete." --max-turns 300

echo "RALPH COMPLETE!"
