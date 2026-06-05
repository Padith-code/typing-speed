
export async function loadPassages() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Impossible de charger data.json.", error);
    return null;
  }
}