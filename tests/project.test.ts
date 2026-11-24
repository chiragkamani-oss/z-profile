import { createProjectSchema } from "@/server/validators/project.schema";

describe("Project Schema Validation", () => {
  it("should validate a complete project payload", () => {
    const valid = {
      name: "Cloud Telemetry Pipeline",
      alias_name: "Project Hermes",
      clientId: "12",
      type: "Microservices",
      category: "Big Data & AI",
      cloud: "GCP",
      solution: "Real-time streaming pipeline processing 10k eps.",
      architecture: "Kafka -> Flink -> BigQuery architecture.",
      responsibilities: ["Lead distributed systems team", "Design event schema"],
      contributions: ["Reduced query latency by 60%"],
    };

    const parsed = createProjectSchema.parse(valid);
    expect(parsed.name).toBe("Cloud Telemetry Pipeline");
    expect(parsed.cloud).toBe("GCP");
    expect(parsed.responsibilities).toHaveLength(2);
  });

  it("should reject project with too short name", () => {
    expect(() =>
      createProjectSchema.parse({
        name: "A",
      })
    ).toThrow();
  });
});
