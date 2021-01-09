export const types = ["Interventions", "Investments", "Actors", "Regulations"];

const colors = ["#89b792", "#4d405a", "#9698B8", "#E7B76E"];

let typeColors = {};
types.forEach((type, i) => {
  typeColors[type] = colors[i % colors.length];
});
export { typeColors };
