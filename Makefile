.PHONY: release release-patch release-minor release-major

# Default: patch release
release: release-patch

release-patch:
	@$(MAKE) _tag BUMP=patch

release-minor:
	@$(MAKE) _tag BUMP=minor

release-major:
	@$(MAKE) _tag BUMP=major

_tag:
	@CURRENT=$$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//') ; \
	if [ -z "$$CURRENT" ]; then CURRENT="0.0.0"; fi ; \
	MAJOR=$$(echo $$CURRENT | cut -d. -f1) ; \
	MINOR=$$(echo $$CURRENT | cut -d. -f2) ; \
	PATCH=$$(echo $$CURRENT | cut -d. -f3) ; \
	if [ "$(BUMP)" = "major" ]; then \
		MAJOR=$$((MAJOR + 1)); MINOR=0; PATCH=0; \
	elif [ "$(BUMP)" = "minor" ]; then \
		MINOR=$$((MINOR + 1)); PATCH=0; \
	else \
		PATCH=$$((PATCH + 1)); \
	fi ; \
	NEXT="$$MAJOR.$$MINOR.$$PATCH" ; \
	echo "Releasing v$$NEXT (was v$$CURRENT)" ; \
	npm version $$NEXT --no-git-tag-version ; \
	git add package.json package-lock.json ; \
	git commit -m "chore: release v$$NEXT" ; \
	git tag "v$$NEXT" ; \
	git push origin main "v$$NEXT"
