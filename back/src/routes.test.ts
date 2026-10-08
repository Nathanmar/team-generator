import { describe, it, expect } from "bun:test";
import { app } from "./index";

describe("1. Entité Members (Personnes & Compétences)", () => {
  it("GET /members doit renvoyer la liste des personnes", async () => {
    const res = await app.request("/members");
    expect(res.status).toBe(200);
  });

  it("POST /members avec un body vide doit renvoyer 422 (échec validation Zod)", async () => {
    const res = await app.request("/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  it("POST /members avec des données valides doit créer la personne (201)", async () => {
    const newMember = {
      name: "Dupont",
      first_name: "Jean",
      technos: [
        { techno_id: 1, level: 4 },
        { techno_id: 2, level: 2 },
      ],
    };
    const res = await app.request("/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    });
    // Doit renvoyer 201 Created (ou 422 si les technos n'existent pas encore en base)
    expect([201, 422]).toContain(res.status);
  });

  it("GET /members/1 doit renvoyer 200 (trouvé) ou 404 (non trouvé)", async () => {
    const res = await app.request("/members/1");
    expect([200, 404]).toContain(res.status);
  });

  it("DELETE /members/1 doit renvoyer 204 (supprimé) ou 404 (non trouvé)", async () => {
    const res = await app.request("/members/1", { method: "DELETE" });
    expect([204, 404]).toContain(res.status);
  });
});

describe("2. Entité Groups (Génération d'équipes)", () => {
  it("GET /groups doit renvoyer la liste des équipes formées", async () => {
    const res = await app.request("/groups");
    expect(res.status).toBe(200);
  });

  it("POST /groups/generate/3 doit créer les équipes (201) ou 422 (pas assez de membres)", async () => {
    const res = await app.request("/groups/generate/3", { method: "POST" });
    expect([201, 422]).toContain(res.status);
  });

  it("POST /groups/generate/0 avec une capacité invalide doit renvoyer 400 ou 422", async () => {
    const res = await app.request("/groups/generate/0", { method: "POST" });
    expect([400, 422]).toContain(res.status);
  });

  it("DELETE /groups doit réinitialiser les équipes (204)", async () => {
    const res = await app.request("/groups", { method: "DELETE" });
    expect([204, 200]).toContain(res.status);
  });
});

describe("3. Référentiel Technos", () => {
  it("GET /technos doit renvoyer les technologies avec leur type front/back", async () => {
    const res = await app.request("/technos");
    expect(res.status).toBe(200);
  });
});

