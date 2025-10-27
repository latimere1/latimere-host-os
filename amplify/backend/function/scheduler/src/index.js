exports.handler = async () => {
  const now = new Date().toISOString();
  console.log(JSON.stringify({ tag: "SCHEDULER_START", now }));
  console.log(JSON.stringify({ tag: "SCHEDULER_OK" }));
  return { ok: true, time: now };
};
