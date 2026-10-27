import { expect, test } from "bun:test";
import { errorCopy, resolveLocale, strings, type Messages } from "../../panel/i18n";
import pkg from "../../package.json";

type MessageBag = Record<string, string>;

function bag(locale: "en" | "zh"): MessageBag {
  return { ...(strings(locale) as unknown as MessageBag) };
}

test("selects Chinese for zh locales and English otherwise", () => {
  expect(resolveLocale("zh-CN")).toBe("zh");
  expect(resolveLocale("zh-TW")).toBe("zh");
  expect(resolveLocale("en-US")).toBe("en");
  expect(resolveLocale("fr-FR")).toBe("en");
});

test("keeps every translation key in both locales", () => {
  const en = bag("en");
  const zh = bag("zh");
  expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
});

test("maps host error codes to file-specific copy and falls back to generic failure", () => {
  const zh = strings("zh");
  expect(errorCopy(zh, "NO_DIRECTORY")).toEqual({
    title: zh.noDirectoryTitle,
    body: zh.noDirectoryBody,
  });
  expect(errorCopy(zh, "NOT_FOUND")).toEqual({
    title: zh.notFoundTitle,
    body: zh.notFoundBody,
  });
  expect(errorCopy(zh, "FILE_TOO_LARGE")).toEqual({
    title: zh.tooLargeTitle,
    body: zh.tooLargeBody,
  });
  expect(errorCopy(zh, "DENIED")).toEqual({
    title: zh.deniedTitle,
    body: zh.deniedBody,
  });
  expect(errorCopy(zh, "NOT_GRANTED")).toEqual({
    title: zh.notGrantedTitle,
    body: zh.notGrantedBody,
  });
  expect(errorCopy(zh, "HOST_REJECTED")).toEqual({
    title: zh.failedTitle,
    body: zh.failedBody,
  });
});

test("exposes a semver version required by the install gate", () => {
  expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
});
