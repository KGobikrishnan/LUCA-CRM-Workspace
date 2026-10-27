#!/bin/bash
# Bulk Dark Theme + Glass UI + Mobile fix script for all 9 pages
# Applies consistent dark: variants to all hardcoded light-mode classes

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
  echo "Processing: $f"

  # ═══════════════════════════════════════
  # CARD & CONTAINER BACKGROUNDS
  # ═══════════════════════════════════════

  # bg-white p-6 rounded-2xl shadow-sm border border-slate-100
  sed -i 's/bg-white p-6 rounded-2xl shadow-sm border border-slate-100/bg-white dark:bg-slate-800\/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700\/60/g' "$FILE"

  # bg-white p-5 rounded-2xl shadow-sm border border-slate-100
  sed -i 's/bg-white p-5 rounded-2xl shadow-sm border border-slate-100/bg-white dark:bg-slate-800\/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700\/60/g' "$FILE"

  # bg-white p-4 rounded-2xl (without dark already)
  sed -i 's/bg-white p-4 rounded-2xl shadow-sm border border-slate-100"/bg-white dark:bg-slate-800\/60 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700\/60"/g' "$FILE"

  # bg-white rounded-2xl shadow-sm border border-slate-200
  sed -i 's/bg-white rounded-2xl shadow-sm border border-slate-200/bg-white dark:bg-slate-800\/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700\/60/g' "$FILE"

  # bg-white rounded-2xl shadow-sm border border-slate-100
  sed -i 's/bg-white rounded-2xl shadow-sm border border-slate-100/bg-white dark:bg-slate-800\/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700\/60/g' "$FILE"

  # ═══════════════════════════════════════
  # TABLE BACKGROUNDS AND HEADERS
  # ═══════════════════════════════════════

  # thead bg-slate-50
  sed -i 's/className="bg-slate-50"/className="bg-slate-50 dark:bg-slate-900\/50"/g' "$FILE"
  sed -i "s/className='bg-slate-50'/className='bg-slate-50 dark:bg-slate-900\/50'/g" "$FILE"

  # tbody bg-white divide-y
  sed -i 's/bg-white divide-y divide-slate-100/bg-white dark:bg-slate-800\/40 divide-y divide-slate-100 dark:divide-slate-700\/50/g' "$FILE"

  # hover:bg-slate-50 transition-colors (table rows)
  sed -i 's/hover:bg-slate-50 transition-colors/hover:bg-slate-50 dark:hover:bg-slate-700\/30 transition-colors/g' "$FILE"

  # ═══════════════════════════════════════
  # TEXT COLORS
  # ═══════════════════════════════════════

  # text-slate-900" (main headings/values — careful not to double-apply)
  sed -i 's/text-slate-900"/text-slate-900 dark:text-white"/g' "$FILE"

  # font-black text-slate-900
  sed -i 's/font-black text-slate-900 dark:text-white dark:text-white/font-black text-slate-900 dark:text-white/g' "$FILE"

  # text-slate-700" (secondary text)
  sed -i 's/text-slate-700"/text-slate-700 dark:text-slate-200"/g' "$FILE"

  # text-slate-500" (muted text)
  sed -i 's/text-slate-500"/text-slate-500 dark:text-slate-400"/g' "$FILE"

  # text-slate-600" 
  sed -i 's/text-slate-600"/text-slate-600 dark:text-slate-300"/g' "$FILE"

  # text-slate-400" 
  sed -i 's/text-slate-400"/text-slate-400 dark:text-slate-500"/g' "$FILE"

  # ═══════════════════════════════════════
  # INPUT FIELDS
  # ═══════════════════════════════════════

  # bg-white border border-slate-200 (inputs)
  sed -i 's/bg-white border border-slate-200 rounded-xl/bg-white dark:bg-slate-800\/60 border border-slate-200 dark:border-slate-700 rounded-xl/g' "$FILE"
  sed -i 's/bg-white border border-slate-200 rounded-lg/bg-white dark:bg-slate-800\/60 border border-slate-200 dark:border-slate-700 rounded-lg/g' "$FILE"

  # bg-slate-50 border border-slate-200 (selects/inputs)
  sed -i 's/bg-slate-50 border border-slate-200/bg-slate-50 dark:bg-slate-800\/60 border border-slate-200 dark:border-slate-700/g' "$FILE"

  # bg-transparent (date inputs inside cards)
  sed -i 's/text-slate-700 bg-transparent/text-slate-700 dark:text-slate-200 bg-transparent dark:bg-transparent/g' "$FILE"

  # ═══════════════════════════════════════
  # ICON CONTAINERS
  # ═══════════════════════════════════════

  # bg-slate-50 p-2 rounded
  sed -i 's/bg-slate-50 p-2 rounded/bg-slate-100 dark:bg-slate-700\/50 p-2 rounded/g' "$FILE"

  # bg-emerald-50 p-2 rounded
  sed -i 's/bg-emerald-50 p-2 rounded/bg-emerald-50 dark:bg-emerald-900\/30 p-2 rounded/g' "$FILE"

  # bg-red-50 p-2 rounded
  sed -i 's/bg-red-50 p-2 rounded/bg-red-50 dark:bg-red-900\/30 p-2 rounded/g' "$FILE"

  # bg-blue-50 p-2 rounded
  sed -i 's/bg-blue-50 p-2 rounded/bg-blue-50 dark:bg-blue-900\/30 p-2 rounded/g' "$FILE"

  # bg-amber-50 p-2 rounded
  sed -i 's/bg-amber-50 p-2 rounded/bg-amber-50 dark:bg-amber-900\/30 p-2 rounded/g' "$FILE"

  # bg-purple-50 p-2 rounded
  sed -i 's/bg-purple-50 p-2 rounded/bg-purple-50 dark:bg-purple-900\/30 p-2 rounded/g' "$FILE"

  # bg-indigo-50 p-2 rounded
  sed -i 's/bg-indigo-50 p-2 rounded/bg-indigo-50 dark:bg-indigo-900\/30 p-2 rounded/g' "$FILE"

  # ═══════════════════════════════════════
  # BADGE/PILL BACKGROUNDS
  # ═══════════════════════════════════════

  sed -i "s/bg-emerald-100 text-emerald-700/bg-emerald-100 dark:bg-emerald-900\/40 text-emerald-700 dark:text-emerald-400/g" "$FILE"
  sed -i "s/bg-red-100 text-red-700/bg-red-100 dark:bg-red-900\/40 text-red-700 dark:text-red-400/g" "$FILE"
  sed -i "s/bg-amber-100 text-amber-700/bg-amber-100 dark:bg-amber-900\/40 text-amber-700 dark:text-amber-400/g" "$FILE"
  sed -i "s/bg-blue-100 text-blue-700/bg-blue-100 dark:bg-blue-900\/40 text-blue-700 dark:text-blue-400/g" "$FILE"
  sed -i "s/bg-purple-100 text-purple-700/bg-purple-100 dark:bg-purple-900\/40 text-purple-700 dark:text-purple-400/g" "$FILE"
  sed -i "s/bg-slate-100 text-slate-700/bg-slate-100 dark:bg-slate-700\/50 text-slate-700 dark:text-slate-300/g" "$FILE"
  sed -i "s/bg-slate-100 text-slate-600/bg-slate-100 dark:bg-slate-700\/50 text-slate-600 dark:text-slate-300/g" "$FILE"

  # ═══════════════════════════════════════
  # MODAL / OVERLAY BACKGROUNDS
  # ═══════════════════════════════════════

  # Modals with bg-white rounded-2xl
  sed -i 's/bg-white rounded-2xl p-/bg-white dark:bg-slate-800 rounded-2xl p-/g' "$FILE"
  sed -i 's/bg-white w-full max-w/bg-white dark:bg-slate-800 w-full max-w/g' "$FILE"
  sed -i 's/bg-white rounded-xl p-/bg-white dark:bg-slate-800 rounded-xl p-/g' "$FILE"

  # ═══════════════════════════════════════
  # BORDERS / DIVIDERS
  # ═══════════════════════════════════════

  # border-b border-slate-100
  sed -i 's/border-b border-slate-100/border-b border-slate-100 dark:border-slate-700\/60/g' "$FILE"

  # border-t border-slate-100
  sed -i 's/border-t border-slate-100/border-t border-slate-100 dark:border-slate-700\/60/g' "$FILE"

  # divide-y divide-slate-100" (not already handled)
  sed -i 's/divide-y divide-slate-100"/divide-y divide-slate-100 dark:divide-slate-700\/50"/g' "$FILE"

  # border border-slate-200" on filter containers
  sed -i 's/bg-white p-2 rounded-xl shadow-sm border border-slate-200/bg-white dark:bg-slate-800\/60 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/g' "$FILE"

  # ═══════════════════════════════════════
  # LOADING / EMPTY STATES
  # ═══════════════════════════════════════

  # bg-slate-50 rounded-full flex items-center (empty state icon)
  sed -i 's/bg-slate-50 rounded-full flex items-center/bg-slate-100 dark:bg-slate-800 rounded-full flex items-center/g' "$FILE"

  # ═══════════════════════════════════════
  # BUTTON DARK VARIANTS
  # ═══════════════════════════════════════

  # bg-primary-600 hover:bg-primary-700
  sed -i 's/bg-primary-600 hover:bg-primary-700/bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600/g' "$FILE"

  # bg-primary-500
  sed -i 's/bg-primary-500/bg-indigo-500/g' "$FILE"
  sed -i 's/text-primary-600/text-indigo-600 dark:text-indigo-400/g' "$FILE"
  sed -i 's/text-primary-700/text-indigo-700 dark:text-indigo-400/g' "$FILE"
  sed -i 's/ring-primary-500/ring-indigo-500/g' "$FILE"
  sed -i 's/bg-primary-50/bg-indigo-50 dark:bg-indigo-900\/30/g' "$FILE"
  sed -i 's/bg-primary-100/bg-indigo-100 dark:bg-indigo-900\/40/g' "$FILE"

  # ═══════════════════════════════════════
  # MISC BACKGROUNDS
  # ═══════════════════════════════════════

  # bg-slate-50/50 (subtle section bg)
  sed -i 's/bg-slate-50\/50/bg-slate-50\/50 dark:bg-slate-900\/30/g' "$FILE"

  # w-px h-6 bg-slate-200 (divider lines)
  sed -i 's/bg-slate-200"><\/div>/bg-slate-200 dark:bg-slate-700"><\/div>/g' "$FILE"

  # ═══════════════════════════════════════
  # MOBILE OPTIMIZATIONS
  # ═══════════════════════════════════════

  # Make main headings responsive
  sed -i 's/text-2xl font-black text-slate-900 dark:text-white tracking-tight/text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight/g' "$FILE"

  # Make top-level padding responsive
  sed -i 's/space-y-6 max-w/space-y-4 lg:space-y-6 max-w/g' "$FILE"

  # Make grid responsive for stat cards (md:grid-cols-4 → grid-cols-2 sm:grid-cols-4)
  sed -i 's/grid grid-cols-1 md:grid-cols-4/grid grid-cols-2 md:grid-cols-4/g' "$FILE"
  sed -i 's/grid grid-cols-1 md:grid-cols-3/grid grid-cols-2 md:grid-cols-3/g' "$FILE"
  sed -i 's/grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4/grid grid-cols-2 md:grid-cols-4/g' "$FILE"
  sed -i 's/grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3/grid grid-cols-2 md:grid-cols-3/g' "$FILE"

  # Fix double-applied dark variants (cleanup)
  sed -i 's/dark:text-white dark:text-white/dark:text-white/g' "$FILE"
  sed -i 's/dark:text-slate-400 dark:text-slate-400/dark:text-slate-400/g' "$FILE"
  sed -i 's/dark:text-slate-200 dark:text-slate-200/dark:text-slate-200/g' "$FILE"
  sed -i 's/dark:text-slate-300 dark:text-slate-300/dark:text-slate-300/g' "$FILE"
  sed -i 's/dark:bg-slate-800\/60 dark:bg-slate-800\/60/dark:bg-slate-800\/60/g' "$FILE"
  sed -i 's/dark:border-slate-700\/60 dark:border-slate-700\/60/dark:border-slate-700\/60/g' "$FILE"
  sed -i 's/dark:border-slate-700 dark:border-slate-700/dark:border-slate-700/g' "$FILE"
  sed -i 's/dark:bg-slate-900\/50 dark:bg-slate-900\/50/dark:bg-slate-900\/50/g' "$FILE"

  echo "  ✅ Done: $f"
done

echo ""
echo "🎉 All 9 pages updated with dark theme, glass UI, and mobile optimizations!"
