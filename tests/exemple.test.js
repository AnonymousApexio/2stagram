/**
 * Test d'exemple illustrant la structure Arrange-Act-Assert (section 7.2).
 * À supprimer une fois les premiers tests métier écrits.
 */

function additionner(a, b) {
  return a + b;
}

describe('additionner', () => {
  test('devrait retourner la somme quand les deux nombres sont positifs', () => {
    // Arrange
    const premier = 2;
    const second = 3;

    // Act
    const resultat = additionner(premier, second);

    // Assert
    expect(resultat).toBe(5);
  });

  test('devrait retourner zero quand les deux nombres sont nuls', () => {
    // Arrange
    const premier = 0;
    const second = 0;

    // Act
    const resultat = additionner(premier, second);

    // Assert
    expect(resultat).toBe(0);
  });
});
