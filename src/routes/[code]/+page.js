// Unified route loader for /[code]
// Only extracts the game code from URL - all other state comes from Firestore
export function load({ params }) {
  const code = params.code?.toUpperCase?.() || '';
  
  return {
    code
  };
}
