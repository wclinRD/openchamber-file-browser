import { expect, test } from "bun:test";
import pkg from "../package.json";

test("declares the supported OpenChamber extension contract", () => {
  expect(pkg.version).toBe("0.1.0");
  expect(pkg.openchamber.apiVersion).toBe(1);
  expect(pkg.openchamber.engines.openchamber).toBe(">=1.24.0");
  expect(pkg.openchamber.contributes.panel.id).toBe("openchamber-file-browser");
  expect(pkg.openchamber.contributes.panel.name).toBe("File Browser");
  expect(pkg.openchamber.contributes.panel.icon).toBe("folder");
  expect(pkg.openchamber.contributes.panel.entry).toBe("panel/index.html");
  expect(pkg.openchamber.contributes.page).toBe(true);
  expect(pkg.openchamber.contributes.capabilities).toEqual(["files"]);
  expect(pkg.openchamber.contributes.filesystem).toEqual(["~/.**"]);
});
