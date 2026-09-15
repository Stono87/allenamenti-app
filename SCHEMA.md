# Schema JSON allenamenti (formato import)

Formato compatto usato sia per il seed iniziale sia per import futuri incollati in chat.

```json
{
  "allenamenti": [
    {
      "id": "a1",
      "n": 1,
      "titolo": "Piramidale Inversa",
      "tipo": "nuoto",
      "durata": "50 min",
      "volume": "2200m",
      "fase": "Base",
      "sezioni": [
        {
          "titolo": "Riscaldamento (8')",
          "righe": [
            "100m SL sciolto",
            "100m dorso sciolto",
            "4×40m gambe rana · rec 10\"",
            "→ 360m"
          ]
        }
      ],
      "totale": "2200m"
    }
  ]
}
```

## Campi
- `id`: stringa univoca, usata come chiave storage completamento (es. "a1", "a11", "casa-3b")
- `n`: numero progressivo mostrato in UI
- `titolo`: nome allenamento
- `tipo`: `"nuoto"` o `"casa"` (determina colore/badge)
- `durata`: stringa libera (es. "50 min")
- `volume`: stringa libera, opzionale per tipo casa (es. "2200m" o "—")
- `fase`: stringa libera (es. "Base", "Sviluppo", "Intensificazione")
- `sezioni`: array di blocchi, ognuno con `titolo` e `righe` (array di stringhe già formattate,
  incluso simboli tipo `→`, `·`, grassetti resi come testo semplice)
- `totale`: stringa riassuntiva finale mostrata in fondo alla scheda (opzionale)

## Regole per import
- Un file importato può contenere 1 o più allenamenti nell'array `allenamenti`.
- Gli `id` devono essere univoci: se un `id` importato coincide con uno esistente, l'app
  chiede conferma prima di sovrascrivere (non sovrascrive mai in automatico).
- Import NON tocca lo stato di completamento salvato per gli id esistenti non toccati.

## Come generare un nuovo blob da incollare (in chat futura)
Basta chiedere: "preparami N allenamenti in formato JSON per l'app" — verrà prodotto un blocco
con questa esatta struttura, pronto da salvare come file `.json` e importare dall'app.
