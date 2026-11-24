describe("Profile Version Increment Logic", () => {
  function computeNextVersionTitle(title: string): string {
    const verMatch = title.match(/\bver\s*(\d+)\b/i);
    if (verMatch) {
      const currentVer = parseInt(verMatch[1], 10);
      const nextVer = currentVer + 1;
      const formattedVer =
        nextVer < 10 && verMatch[1].length >= 2 ? `0${nextVer}` : `${nextVer}`;
      return title.replace(/\bver\s*\d+\b/i, `ver${formattedVer}`);
    }
    return `${title} ver02`;
  }

  it("should increment ver01 to ver02", () => {
    expect(computeNextVersionTitle("Dilip Bheda Web developer ver01")).toBe(
      "Dilip Bheda Web developer ver02"
    );
  });

  it("should increment ver09 to ver10", () => {
    expect(computeNextVersionTitle("Dilip Bheda Web developer ver09")).toBe(
      "Dilip Bheda Web developer ver10"
    );
  });

  it("should increment ver1 to ver2", () => {
    expect(computeNextVersionTitle("John Doe Cloud Architect ver1")).toBe(
      "John Doe Cloud Architect ver2"
    );
  });

  it("should append ver02 if title has no version suffix", () => {
    expect(computeNextVersionTitle("Chirag Kamani Principal Architect")).toBe(
      "Chirag Kamani Principal Architect ver02"
    );
  });
});
