PHONY: github

github:
	npm run build
	scp -r ./build ./docs
	npx staticrypt ./docs/index.html climate -o ./docs/index.html
	git add -A
	git commit -m "update github pages"
	git push