// Explicit placeholder so that we can claim an endpoint without pretending it works
export function notImplemented(feature) {
  return (_req, res) => res.status(501).json({ error: `${feature} has not been implemented yet` });
}
