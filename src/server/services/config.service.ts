import { prisma } from "@/lib/prisma";

export interface TaxonomyConfig {
  designation: {
    levels: string[];
    core_responsibility: string[];
    speciality: string[];
  };
  technologies: Record<string, string[]>;
  domains: string[];
  tools: string[];
  industries: Record<string, string[]>;
  education: {
    degrees: string[];
    courses: string[];
  };
}

const DEFAULT_CONFIG: TaxonomyConfig = {
  designation: {
    levels: ["Junior", "Associate", "Staff", "Senior", "Lead", "Principal", "Director"],
    core_responsibility: [
      "Software Engineer",
      "Full Stack Developer",
      "Cloud Architect",
      "DevOps Engineer",
      "QA Automation Engineer",
      "Data Engineer",
      "Security Engineer",
    ],
    speciality: [
      "Cloud & Platform",
      "Frontend & Mobile",
      "Distributed Systems",
      "Data Analytics & AI",
      "Enterprise Backend",
    ],
  },
  technologies: {
    "Frontend Frameworks": ["React", "Next.js", "Vue.js", "Angular", "TypeScript"],
    "Backend & Services": ["Node.js", "Python", "Go", "Java", "C#", "Rust"],
    "Cloud & Infrastructure": [
      "AWS",
      "Google Cloud",
      "Microsoft Azure",
      "Kubernetes",
      "Docker",
      "Terraform",
    ],
    Databases: ["PostgreSQL", "MariaDB", "MySQL", "MongoDB", "Redis", "Elasticsearch"],
  },
  domains: [
    "Enterprise SaaS",
    "FinTech & Payments",
    "Healthcare & HealthTech",
    "E-Commerce & Retail",
    "Telecommunications",
    "Cybersecurity",
    "IoT & Embedded Systems",
  ],
  tools: [
    "Git",
    "GitHub Actions",
    "GitLab CI",
    "Jenkins",
    "ArgoCD",
    "Jira",
    "Datadog",
    "Prometheus",
    "Grafana",
  ],
  industries: {
    Healthcare: ["Hospital Systems", "Clinical Diagnostics", "Telemedicine"],
    "Financial Services": ["Payment Gateways", "Lending", "Wealth Management"],
    Technology: ["Cloud Infrastructure", "DevTools", "AI Platform"],
  },
  education: {
    degrees: [
      "Bachelor of Technology (B.Tech)",
      "Bachelor of Engineering (B.E.)",
      "Master of Science (M.S.)",
      "Master of Computer Applications (MCA)",
      "Doctor of Philosophy (Ph.D.)",
    ],
    courses: [
      "Computer Science & Engineering",
      "Information Technology",
      "Software Engineering",
      "Data Science & Analytics",
    ],
  },
};

export class ConfigService {
  private static OPTION_KEY = "_zprofile_master_config";

  static async getConfig(): Promise<TaxonomyConfig> {
    const option = await prisma.wp_options.findFirst({
      where: { option_name: this.OPTION_KEY },
    });

    if (!option || !option.option_value) {
      return DEFAULT_CONFIG;
    }

    try {
      const parsed = JSON.parse(option.option_value);
      return {
        designation: {
          ...DEFAULT_CONFIG.designation,
          ...(parsed.designation || {}),
        },
        technologies: {
          ...DEFAULT_CONFIG.technologies,
          ...(parsed.technologies || {}),
        },
        domains: Array.isArray(parsed.domains) ? parsed.domains : DEFAULT_CONFIG.domains,
        tools: Array.isArray(parsed.tools) ? parsed.tools : DEFAULT_CONFIG.tools,
        industries: {
          ...DEFAULT_CONFIG.industries,
          ...(parsed.industries || {}),
        },
        education: {
          ...DEFAULT_CONFIG.education,
          ...(parsed.education || {}),
        },
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static async updateConfig(newConfig: Partial<TaxonomyConfig>): Promise<TaxonomyConfig> {
    const current = await this.getConfig();
    const merged: TaxonomyConfig = {
      ...current,
      ...newConfig,
    };

    const existing = await prisma.wp_options.findFirst({
      where: { option_name: this.OPTION_KEY },
    });

    if (existing) {
      await prisma.wp_options.update({
        where: { option_id: existing.option_id },
        data: { option_value: JSON.stringify(merged) },
      });
    } else {
      await prisma.wp_options.create({
        data: {
          option_name: this.OPTION_KEY,
          option_value: JSON.stringify(merged),
          autoload: "yes",
        },
      });
    }

    return merged;
  }
}
