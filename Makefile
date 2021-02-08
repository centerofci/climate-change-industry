PHONY: github

github:
	git stash
	git pull --rebase
	git stash apply
	npm run github
	git add -A
	git commit -m "update github pages"
	git push