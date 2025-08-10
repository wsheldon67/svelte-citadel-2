export function load({ params, url }) {
  const code = params.code?.toUpperCase?.() || '';
  const playerCount = Number(url.searchParams.get('pc') || '2');
  const lpp = Number(url.searchParams.get('lpp') || '3');
  const ppp = Number(url.searchParams.get('ppp') || '3');
  const cpp = Number(url.searchParams.get('cpp') || '3');
  const variant = url.searchParams.get('variant') || '';

  return {
    code,
    setup: {
      playerCount,
      landsPerPlayer: lpp,
      personalPiecesPerPlayer: ppp,
      communityPiecesPerPlayer: cpp,
      variant
    }
  };
}
