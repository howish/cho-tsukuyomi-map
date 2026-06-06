## ADDED Requirements

### Requirement: Pluggable adapter contract

Each organizer adapter SHALL be a single Python module under `scripts/adapters/<organizer>.py` that exposes one function `parse(url: str) -> list[BoothScaffold]`.

#### Scenario: Adapter signature is uniform

- **GIVEN** an adapter file at `scripts/adapters/<organizer>.py`
- **WHEN** the bootstrap script imports it as `from scripts.adapters.<organizer> import parse`
- **THEN** the symbol `parse` exists and accepts one positional `url` argument
- **AND** it returns a list of dicts conforming to the `BoothScaffold` schema (booth_id, circle_name, link, info, optional img)

#### Scenario: New organizer adds one file

- **WHEN** a new organizer format is needed (e.g. coproshop, sangenbouken)
- **THEN** the only code change required is `scripts/adapters/<new_organizer>.py` plus an import registration in `scripts/bootstrap_event.py`
- **AND** no changes to the event template or recon pipeline are needed

### Requirement: Ketcom adapter (Shift-JIS CGI)

The `scripts/adapters/ketcom.py` adapter SHALL parse Shift-JIS-encoded `clist.cgi` pages used by ketto.xsrv.jp events.

#### Scenario: Parse ヤオヨロー page

- **WHEN** `parse('https://ketto.xsrv.jp/html/mimiken/clist.cgi?pr2,%83%84%83I%83%88%83%8D%81%5B%21')` is called
- **THEN** the adapter fetches the page, decodes Shift-JIS, and extracts every circle row
- **AND** returns at least 30 booth scaffolds with `booth_id` (e.g. "ヤオ-01"), `circle_name`, and `link` (or `null` if no link in source)

#### Scenario: Adapter handles encoding fallback

- **WHEN** the source declares charset as `shift_jis` in HTTP or meta tag
- **THEN** the adapter respects that declared encoding instead of guessing

### Requirement: GJS adapter (circle-list-if.js JSON)

The `scripts/adapters/gjs.py` adapter SHALL parse the `circle-list-if.js` format used by if.gjs.tw events (IF series, CH series).

#### Scenario: Parse IF7 official list

- **WHEN** `parse('https://if.gjs.tw/circle-list.html')` is called
- **THEN** the adapter fetches the page, locates the linked JS file (or uses the URL pattern `js/circle-list-<event>.js`), extracts the `var circleData = [...]` array, and returns 555 booth scaffolds
- **AND** normalizes booth IDs from `J01J02` to `J-01/02` form
- **AND** captures the `link`, `info`, and `img` fields from each entry

#### Scenario: Adapter handles related-event variants

- **WHEN** the operator passes a URL for a different GJS event (e.g. `https://if.gjs.tw/ch19-list.html` or future iterations)
- **THEN** the adapter follows the same `var circleData = [...]` extraction pattern without code changes

### Requirement: Doujin.com.tw adapter (convention page)

The `scripts/adapters/doujin_tw.py` adapter SHALL parse convention pages on doujin.com.tw when the organizer publishes circle lists there.

#### Scenario: Parse a convention page

- **WHEN** `parse('https://www.doujin.com.tw/conventions/info/<conv_id>')` is called
- **THEN** the adapter fetches the page, extracts circle rows from the HTML table, and returns booth scaffolds
- **AND** the `link` field is the doujin.com.tw author/group page (https://www.doujin.com.tw/authors/info/<handle> or .../groups/info/<id>)
