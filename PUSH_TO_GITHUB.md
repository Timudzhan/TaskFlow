# Как закинуть проект на GitHub и запускать тесты автоматически

1) Создайте репозиторий на GitHub (через сайт) или используйте `gh` (GitHub CLI).

2) Если у вас ещё нет локального git:

```bash
git init
git add .
git commit -m "Initial commit"
```

3) Подключите удалённый репозиторий и отправьте код (пример с HTTPS):

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Или с `gh` (упрощённо):

```bash
gh repo create <repo-name> --public --source=. --remote=origin --push
```

4) Что делает добавленный CI: файл [.github/workflows/ci.yml](.github/workflows/ci.yml) запускается при `push` и `pull_request`.

- Для Python: запускается `pytest` и на основе результата создаётся комментарий в PR или статус коммита с текстом:
  - "✅ Ваши тесты прошли успешно." или
  - "❌ Тесты не прошли."

5) Как проверить результаты:

- В PR: после пуша появится комментарий с результатом.
- При прямом пуше в ветку: на странице коммита появится статус `CI/pytest` (success/failure) с русским описанием.

6) Примечания:
- Если хотите, чтобы workflow запускал дополнительные проверки (например `npm test`), добавьте скрипты в `package.json`.
- Если нужно, могу настроить детальные отчёты или включить уведомления в Telegram/Slack.
