#!/bin/bash
# Final pass - modals, remaining bg-white containers, and heading dark text

FILES=(
  "financials/QuotationsPage.jsx"
  "financials/InvoicesPage.jsx"
  "financials/ReceiptsPage.jsx"
  "financials/ExpensesPage.jsx"
  "financials/PayrollPage.jsx"
  "hr/AttendancePage.jsx"
)

DIR="/home/luca/Code/Navi/Navi_Projects/New/frontend/src/pages"

for f in "${FILES[@]}"; do
  FILE="$DIR/$f"
  echo "Final pass: $f"

  # Fix modal containers
  sed -i 's/bg-white rounded-2xl shadow-xl w-full/bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full/g' "$FILE"

  # Fix any remaining bg-slate-50 used as section bg without dark:
  sed -i 's/"bg-slate-50 flex/"bg-slate-50 dark:bg-slate-900\/40 flex/g' "$FILE"
  sed -i "s/'bg-slate-50 flex/'bg-slate-50 dark:bg-slate-900\/40 flex/g" "$FILE"

  # Fix heading text that didn't get dark variant
  sed -i 's/text-lg font-black text-slate-900 tracking-tight"/text-lg font-black text-slate-900 dark:text-white tracking-tight"/g' "$FILE"

  # Make stat card grids mobile: 2-col
  sed -i 's/grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4/grid grid-cols-2 xl:grid-cols-4/g' "$FILE"
  sed -i 's/grid grid-cols-1 sm:grid-cols-3/grid grid-cols-2 sm:grid-cols-3/g' "$FILE"

  # Fix remaining bg-white used on inputs and misc containers
  sed -i 's/"bg-white shadow-sm/"bg-white dark:bg-slate-800\/60 shadow-sm/g' "$FILE"

  # Cleanup double dark:bg-slate-800
  sed -i 's/dark:bg-slate-800 dark:bg-slate-800/dark:bg-slate-800/g' "$FILE"
  sed -i 's/dark:bg-slate-800\/60 dark:bg-slate-800\/60/dark:bg-slate-800\/60/g' "$FILE"

  echo "  ✅ $f"
done

echo "🎉 Final pass complete!"
