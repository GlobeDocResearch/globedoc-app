import { test, expect } from "bun:test";
import { createBrowserTranscription, appendDictation } from "./transcription.ts";

function setup(language = "en-GB") {
  let instance;
  let text = "";
  let ended = 0;
  let error;
  class Recognition {
    start() { instance = this; this.onstart?.(); }
    stop() { this.onend?.(); }
    abort() { this.aborted = true; }
  }
  const service = createBrowserTranscription(() => Recognition);
  const session = service.start({ language, onText: value => { text = value; }, onStart() {}, onEnd: () => { ended++; }, onError: value => { error = value; } });
  return { service, session, get instance() { return instance; }, get text() { return text; }, get ended() { return ended; }, get error() { return error; } };
}
test("voice service recognises English and Swedish with live interim results", () => {
  for (const language of ["en-GB", "sv-SE"]) {
    const s = setup(language);
    expect(s.instance.lang).toBe(language);
    expect(s.instance.interimResults).toBe(true);
    expect(s.instance.continuous).toBe(true);
  }
});
test("interim revisions replace text rather than duplicate it, and stopping keeps the final text", () => {
  const s = setup();
  s.instance.onresult({ results: [{ 0: { transcript: "A test" }, isFinal: false }] });
  expect(s.text).toBe("A test");
  s.instance.onresult({ results: [{ 0: { transcript: "A test note" }, isFinal: true }, { 0: { transcript: "Second sentence" }, isFinal: false }] });
  s.session.stop();
  expect(s.text).toBe("A test note Second sentence");
  expect(s.ended).toBe(1);
});
test("dictating into note and lab fields preserves existing user text", () => {
  expect(appendDictation("Existing text", " New words ")).toBe("Existing text New words");
  expect(appendDictation("Existing text\n", "New words")).toBe("Existing text\nNew words");
  expect(appendDictation("Existing text", " ")).toBe("Existing text");
});
test("unsupported browser and microphone denial are handled without storing audio", () => {
  expect(createBrowserTranscription(() => undefined).supported()).toBe(false);
  const s = setup();
  s.instance.onerror({ error: "not-allowed" });
  expect(s.error).toBe("permission");
  s.session.abort();
  expect(s.instance.aborted).toBe(true);
  expect(s.instance.onresult).toBeNull();
  expect(s.instance.onend).toBeNull();
});