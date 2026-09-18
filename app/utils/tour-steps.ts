/**
 * Inhalte der gefuehrten Einfuehrung.
 *
 * Bewusst eine einzige Datei: der gesamte Text der Fuehrung steht hier, das
 * macht ihn lektorierbar und spaeter in einem Zug uebersetzbar. Die App
 * mischt heute ohnehin i18n-Keys und festen deutschen Text (siehe
 * `pages/dashboard/reports.vue`), deshalb bleibt das hier konsistent.
 *
 * `target` verweist auf ein `data-tour`-Attribut im Markup. Fehlt das Element
 * – etwa weil ein Bereich auf Mobilgeraeten ausgeblendet ist – zeigt die
 * Fuehrung den Schritt mittig ohne Spotlight statt abzubrechen.
 */

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  /** Stabiler Schluessel, taucht nicht in der UI auf */
  id: string
  /** Vor dem Schritt hierhin navigieren */
  route?: string
  /** Wert des `data-tour`-Attributs des hervorzuhebenden Elements */
  target?: string
  title: string
  body: string
  /** Bevorzugte Seite der Sprechblase; kippt automatisch, wenn kein Platz ist */
  placement?: TourPlacement
  /** „Weiter“ navigiert zuerst hierhin */
  nextRoute?: string
  /** Erreicht der Nutzer diese Route selbst, geht es automatisch weiter */
  advanceOnRoute?: string | RegExp
  /** Schluessel einer Aktion, die die Seite bereitstellt (siehe Tour-Store) */
  action?: string
  actionLabel?: string
  /** Beschriftung des Weiter-Knopfes, wenn „Weiter“ nicht passt */
  nextLabel?: string
}

/** Produktdetailseite – alles ausser /dashboard/products/new */
const PRODUCT_DETAIL_ROUTE = /^\/dashboard\/products\/(?!new$)[^/]+$/

export const TOUR_STEPS: TourStep[] = [
  {
    id:    'welcome',
    route: '/dashboard',
    title: 'Willkommen bei PassPort DPP',
    body:  'In den nächsten Minuten legen wir gemeinsam Ihren ersten digitalen Produktpass an. '
         + 'Sie können die Führung jederzeit beenden und später unter Einstellungen → Einführung fortsetzen.',
    nextLabel: 'Los geht’s',
  },
  {
    id:        'nav',
    target:    'nav',
    placement: 'right',
    title:     'Ihre Navigation',
    body:      'Hier erreichen Sie alle Bereiche: Produktpässe, Lieferkette, Regulatorik, Berichte und die Einstellungen. '
             + 'Die rote Zahl neben „Produktpässe“ zeigt, wie viele Pässe gerade kritische Lücken haben.',
  },
  {
    id:        'kpis',
    target:    'kpis',
    placement: 'bottom',
    title:     'Ihre Kennzahlen auf einen Blick',
    body:      'Diese vier Kacheln fassen den Stand aller Produktpässe zusammen: Anzahl, durchschnittliche '
             + 'Vollständigkeit, offene Datenlücken und die nächste anstehende Frist.',
  },
  {
    id:        'notifications',
    target:    'notifications',
    placement: 'bottom',
    title:     'Fristen und Meldungen',
    body:      'Nähert sich eine regulatorische Frist oder entsteht eine neue Datenlücke, landet die Meldung hier. '
             + 'Was Sie benachrichtigt werden möchten, stellen Sie unter Einstellungen → Benachrichtigungen ein.',
  },
  {
    id:             'start-create',
    target:         'new-dpp',
    placement:      'bottom',
    title:          'Jetzt legen wir einen Produktpass an',
    body:           'Über diesen Knopf entsteht ein neuer DPP. Klicken Sie ihn an – oder lassen Sie sich von '
                  + '„Weiter“ dorthin bringen.',
    nextRoute:      '/dashboard/products/new',
    advanceOnRoute: '/dashboard/products/new',
  },
  {
    id:          'form-basics',
    route:       '/dashboard/products/new',
    target:      'form-basics',
    placement:   'right',
    title:       'Stammdaten',
    body:        'Produktname und SKU sind die einzigen Pflichtfelder – alles andere lässt sich später ergänzen. '
               + 'Wenn Sie nur ausprobieren möchten, füllen wir das Formular mit einem Beispielprodukt.',
    action:      'prefill-product',
    actionLabel: 'Beispieldaten einfügen',
  },
  {
    id:        'form-appearance',
    target:    'form-appearance',
    placement: 'right',
    title:     'Darstellung',
    body:      'Symbol und Farben erscheinen in der Produktliste und auf dem öffentlichen Pass. '
             + 'Rein optisch – aber bei vielen Pässen hilft es beim schnellen Wiederfinden.',
  },
  {
    id:        'form-sustainability',
    target:    'form-sustainability',
    placement: 'right',
    title:     'Nachhaltigkeitskennzahlen',
    body:      'CO₂-Bilanz, Energieklasse, Reparierbarkeit und Recyclingquote. Genau diese Angaben verlangt die '
             + 'EU-Ökodesign-Verordnung (ESPR) – fehlen sie, meldet die App später eine Datenlücke.',
  },
  {
    id:        'form-materials',
    target:    'form-materials',
    placement: 'right',
    title:     'Materialien und Lieferkette',
    body:      'Je Material tragen Sie Anteil und Recyclinganteil ein. Darunter bilden Sie die Lieferkette ab – '
             + 'von den Rohstoffen bis zum End-of-Life. Das ist die Grundlage für LkSG-Nachweise.',
  },
  {
    id:             'form-submit',
    target:         'form-submit',
    placement:      'top',
    title:          'Pass anlegen',
    body:           'Ein Klick hier legt den Produktpass an und bringt Sie direkt zu seiner Detailseite. '
                  + 'Sobald das passiert ist, geht die Führung dort weiter.',
    advanceOnRoute: PRODUCT_DETAIL_ROUTE,
    nextLabel:      'Überspringen',
  },
  {
    id:        'detail-completeness',
    target:    'completeness',
    placement: 'bottom',
    title:     'Vollständigkeit',
    body:      'Dieser Balken zeigt, wie vollständig der Pass ist. Die App leitet daraus den Status ab: '
             + 'vollständig, lückenhaft oder kritisch. Die Schwellen dafür ändern Sie unter Einstellungen → DPP-Regeln.',
  },
  {
    id:        'detail-gaps',
    target:    'gaps',
    placement: 'top',
    title:     'Datenlücken schließen',
    body:      'Fehlende oder veraltete Angaben stehen hier mit ihrer Frist. Über das Häkchen markieren Sie '
             + 'eine Lücke als behoben – die Vollständigkeit steigt entsprechend.',
  },
  {
    id:        'detail-qr',
    target:    'qr',
    placement: 'left',
    title:     'QR-Code und öffentlicher Pass',
    body:      'Jeder Produktpass hat eine öffentliche Seite, die Sie über diesen QR-Code auf das Produkt drucken. '
             + 'Kunden und Behörden sehen dort genau die Angaben, die Sie freigegeben haben.',
  },
  {
    id:        'export',
    target:    'export-pass',
    placement: 'bottom',
    title:     'Exportieren',
    body:      'Den Pass exportieren Sie als maschinenlesbares JSON. Sammelexporte für Behörden und Audits '
             + 'finden Sie unter Berichte – als CSV für Excel oder als Gesamtexport.',
  },
  {
    id:        'finish',
    title:     'Das war’s',
    body:      'Sie kennen jetzt den Weg vom leeren Formular zum fertigen Produktpass. '
             + 'Die Führung können Sie jederzeit unter Einstellungen → Einführung erneut starten.',
    nextLabel: 'Führung beenden',
  },
]
