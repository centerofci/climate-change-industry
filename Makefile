PHONY: github

github:
	npm run build
	npx staticrypt ./index.html climate -o ./index.html
	scp -r build docs
	git add -A
	git commit -m "update github pages"
	git push