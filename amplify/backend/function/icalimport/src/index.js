exports.handler = async () => {
  const now = new Date().toISOString();
  console.log(JSON.stringify({ tag: "ICAL_IMPORT_START", now }));
  console.log(JSON.stringify({ tag: "ICAL_IMPORT_OK" }));
  return { ok: true, time: now };
};
