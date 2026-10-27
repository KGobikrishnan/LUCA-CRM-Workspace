#!/bin/bash
# Second pass - catch remaining edge-case patterns

FILES=(
  "financials/QuotationsPage.jsx"
  "financials/InvoicesPage.jsx"
  "financials/ReceiptsPage.jsx"
  "financials/ExpensesPage.jsx"
  "financials/PayrollPage.jsx"
  "financials/GeneralLedgerPage.jsx"
  "financials/ProfitLossPage.jsx"
  "hr/AttendancePage.jsx"
  "hr/LeaveRequestsPage.jsx"
)

DIR="/home/luca/Code/Navi/Navi_Projects/New/frontend/src/pages"

for f in "${FILES[@]}"; do
  FILE="$DIR/$f"
  echo "Pass 2: $f"

  # Catch bg-white p-4 rounded-xl patterns
  sed -i 's/bg-white p-4 rounded-xl/bg-white dark:bg-slate-800\/60 p-4 rounded-xl/g' "$FILE"
  sed -i 's/bg-white p-2 rounded-xl/bg-white dark:bg-slate-800\/60 p-2 rounded-xl/g' "$FILE"
  sed -i 's/bg-white p-2 rounded-lg/bg-white dark:bg-slate-800\/60 p-2 rounded-lg/g' "$FILE"
  sed -i 's/bg-white p-2.5 rounded-lg/bg-white dark:bg-slate-800\/60 p-2.5 rounded-lg/g' "$FILE"
  sed -i 's/bg-white p-1.5 rounded-xl/bg-white dark:bg-slate-800\/60 p-1.5 rounded-xl/g' "$FILE"

  # Catch remaining border-slate-200 without dark variant
  sed -i 's/border border-slate-200 shadow-sm"/border border-slate-200 dark:border-slate-700 shadow-sm"/g' "$FILE"

  # Remaining border-slate-100 without dark on containers  
  sed -i 's/border border-slate-100 no-print/border border-slate-100 dark:border-slate-700\/60 no-print/g' "$FILE"
  sed -i 's/border border-slate-100 flex/border border-slate-100 dark:border-slate-700\/60 flex/g' "$FILE"

  # bg-slate-50 without dark variant (non-thead)
  sed -i 's/bg-slate-50 p-/bg-slate-50 dark:bg-slate-900\/40 p-/g' "$FILE"

  # Cleanup double dark variants
  sed -i 's/dark:bg-slate-800\/60 dark:bg-slate-800\/60/dark:bg-slate-800\/60/g' "$FILE"
  sed -i 's/dark:border-slate-700\/60 dark:border-slate-700\/60/dark:border-slate-700\/60/g' "$FILE"
  sed -i 's/dark:border-slate-700 dark:border-slate-700/dark:border-slate-700/g' "$FILE"

  echo "  ✅ $f"
done

echo "🎉 Pass 2 complete!"
