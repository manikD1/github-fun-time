# GitHub Identity on macOS: The Three Separate Identities

> A beginner-friendly cheat sheet for understanding which GitHub identity is being used in the browser, in commits, and for Git authentication.

## The short version

On a Mac, “my GitHub account” can mean three different things:

| Identity | What it controls | How to check it quickly | Example |
|---|---|---|---|
| **1. GitHub.com browser login** | The account currently using the GitHub website | Open GitHub, click your profile picture, and view the username | `manikD1` |
| **2. Git commit identity** | The name and email written into new commits | `git config user.name` and `git config user.email` | `Manik Dixit <email>` |
| **3. GitHub authentication** | The account that GitHub allows to push/pull over HTTPS | Ask the GitHub API which account owns the stored token | `manikdixit23` |

These identities are independent. They can match, but they do not have to.

For example, one Mac could simultaneously have:

```text
GitHub.com browser login  → manikD1
Git commit identity       → Manik Dixit <manik@example.com>
HTTPS authentication      → manikdixit23
```

Changing one of these does **not** automatically change the other two.

---

## A clear mental model

Think of the three identities as answering three different questions:

```text
Browser login
    “Who am I while using github.com in this browser?”

Commit identity
    “Whose name and email will be recorded inside the commit?”

Authentication identity
    “Which GitHub account is proving that this push or pull is authorized?”
```

A useful analogy:

- The **browser login** is the person currently using the GitHub website.
- The **commit identity** is the signature printed on a document.
- The **authentication identity** is the key used to unlock the remote repository.

The signature and the key are not the same thing. Writing `manikD1` in Git configuration does not give the computer access to repositories owned by `manikD1`. Access comes from the stored credential or SSH key.

---

# 1. GitHub.com browser login

## What it is

This is the GitHub account currently signed in at [github.com](https://github.com/) in a particular browser or browser profile.

It controls website actions such as:

- viewing account settings;
- creating repositories through the website;
- opening issues and pull requests;
- starring repositories;
- changing account or repository settings.

It does **not** determine the identity stored in Git commits, and it does not necessarily determine which account the command line uses for `git push`.

## How to check it

1. Open [github.com](https://github.com/).
2. Click the profile picture in the upper-right corner.
3. Look for the displayed username, or choose **Your profile**.
4. The profile address should look like one of these:

```text
https://github.com/manikD1
https://github.com/manikdixit23
```

### Browser profiles matter

Chrome, Safari, Firefox, and other browsers can each have a different GitHub session. Separate Chrome profiles can also be logged in to different accounts. Always check the exact browser profile you are using.

## How to change it

1. On GitHub.com, click the profile picture.
2. Sign out, or use GitHub's account-switching option if available.
3. Sign in with the desired account, such as `manikD1` or `manikdixit23`.

This changes only the website session. It does not change `git config`, macOS Keychain credentials, or SSH keys.

---

# 2. Git commit identity: `user.name` and `user.email`

## What it is

Every Git commit contains author and committer metadata, including a name and email address. Git normally gets those values from:

```text
user.name
user.email
```

This identity determines what is written into **new commits**. It is not a GitHub password, login, or permission.

GitHub normally links a commit to a GitHub profile when the commit email belongs to, and is verified on, that GitHub account. If privacy is important, use the exact GitHub-provided `noreply` address shown under **GitHub Settings → Emails**.

## Check the effective identity for the current repository

Run these commands while inside the repository:

```bash
git config user.name
git config user.email
```

These show the values Git will currently use. A repository-specific value overrides the global value.

To see both the value and the configuration file it came from:

```bash
git config --show-origin --get user.name
git config --show-origin --get user.email
```

This is especially useful when a value is not what you expected.

## Check the global default

The global identity is the default for repositories owned by the current macOS user:

```bash
git config --global --get user.name
git config --global --get user.email
```

## Check repository-specific settings

Run these inside the repository:

```bash
git config --local --get user.name
git config --local --get user.email
```

No output normally means that the repository has no local override, so Git falls back to the global configuration or another configuration level.

## Check the identity already stored in the latest commit

```bash
git log -1 --format='Author: %an <%ae>%nCommitter: %cn <%ce>'
```

This reads an existing commit. It is different from checking which identity Git will use for the next commit.

## Change the global commit identity

Use this when most or all repositories on the Mac should use the same identity:

```bash
git config --global user.name "Manik Dixit"
git config --global user.email "YOUR_EMAIL_ADDRESS"
```

Then verify:

```bash
git config --global --get user.name
git config --global --get user.email
```

Replace `YOUR_EMAIL_ADDRESS` with an email verified on the intended GitHub account, or with the exact GitHub `noreply` email shown in that account's email settings.

## Change the identity for only one repository

First enter the repository, then run:

```bash
git config --local user.name "Manik Dixit"
git config --local user.email "YOUR_EMAIL_ADDRESS"
```

Verify the effective identity:

```bash
git config user.name
git config user.email
```

The local settings are stored in that repository and override the global settings.

This is useful when, for example:

- personal repositories should use an email connected to `manikdixit23`; and
- work or practice repositories should use an email connected to `manikD1`.

## Remove a repository-specific override

Run inside the repository:

```bash
git config --local --unset user.name
git config --local --unset user.email
```

The repository will then fall back to the global identity. If a setting was already absent, Git may print an error or return a non-zero status; that is harmless.

## Important limitation

Changing `user.name` or `user.email` affects **future commits only**. It does not automatically rewrite old commits.

If the most recent commit has the wrong identity and has not been shared, it can be recreated with corrected author information after fixing the configuration:

```bash
git commit --amend --reset-author --no-edit
```

Amending changes the commit ID. Avoid rewriting commits that other people already use unless you understand and coordinate the history change.

---

# 3. GitHub authentication for HTTPS push and pull

## What it is

When a repository uses an HTTPS remote such as:

```text
https://github.com/OWNER/REPOSITORY.git
```

Git needs a credential for operations that require authorization. On macOS, this is commonly a personal access token or another GitHub-issued credential stored in Keychain.

The account that owns the credential is the account GitHub treats as authenticated. The username text stored beside the token can be misleading; the token itself determines the real account and permissions.

## First check whether the remote uses HTTPS or SSH

Inside the repository, run:

```bash
git remote -v
```

Common results:

```text
# HTTPS
origin  https://github.com/OWNER/REPOSITORY.git (fetch)
origin  https://github.com/OWNER/REPOSITORY.git (push)

# SSH
origin  git@github.com:OWNER/REPOSITORY.git (fetch)
origin  git@github.com:OWNER/REPOSITORY.git (push)
```

The Keychain instructions below apply to **HTTPS** authentication. SSH authentication is covered later at a high level.

## Check which credential helper Git uses

```bash
git config --show-origin --get-all credential.helper
```

If the result contains:

```text
osxkeychain
```

Git is configured to use the macOS Keychain credential helper.

The relationship is:

```text
git push or git pull over HTTPS
        ↓
Git asks credential.helper for a credential
        ↓
credential.helper=osxkeychain
        ↓
Git reads the GitHub credential from macOS Keychain
        ↓
GitHub decides which account owns that credential
```

`credential.helper=osxkeychain` does not name a GitHub account. It only tells Git where to retrieve and store credentials.

## Safest visual inspection: Keychain Access

1. Open **Keychain Access** on the Mac.
2. Search for `github.com`.
3. Open the relevant Internet password item.
4. Look at its **Account** field.
5. Do **not** reveal or copy the password/token unless absolutely necessary.

The Account field might contain `manikD1`, `manikdixit23`, or even a numeric value such as `104916959`. That field is a clue, but it is not always definitive. The GitHub API check below gives the authoritative login associated with the stored token.

## Definitive check: ask GitHub which account owns the stored token

The following command retrieves the token into a temporary shell variable, sends it to GitHub's `/user` API, prints only the `login` line, and then removes the variable:

```bash
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' \
  | git credential-osxkeychain get \
  | sed -n 's/^password=//p')

if [ -z "$TOKEN" ]; then
  echo "No GitHub HTTPS token was found in macOS Keychain."
else
  curl --silent --show-error --fail \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/user \
    | sed -n 's/.*"login"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/Authenticated GitHub login: \1/p'
fi

unset TOKEN
```

Expected output:

```text
Authenticated GitHub login: manikD1
```

or:

```text
Authenticated GitHub login: manikdixit23
```

### Why this check is better than trusting `username=`

A stored Keychain record can show a username such as `104916959`. That does not prove that the account's GitHub login is literally `104916959`.

The definitive path is:

```text
Stored credential → GitHub API → authenticated account login
```

### Token safety warning

> **Never paste a GitHub token into chat, email, a note, an issue, a commit, or a screenshot. Treat it like a password.**

The command above does not print the token. It temporarily holds the token in the current shell's `TOKEN` variable and removes that variable at the end.

If the command is interrupted before `unset TOKEN`, run:

```bash
unset TOKEN
```

Also avoid enabling shell command tracing (for example, `set -x`) while working with credentials because tracing can print expanded secret values.

## Direct Keychain-helper inspection: use with caution

This lower-level command displays the complete stored credential:

```bash
printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain get
```

It may print both a username and a `password=` value containing the secret token.

> **Do not run this while screen-sharing or recording. Never paste its complete output anywhere.** If it prints a token, clear the terminal display afterward and consider rotating the token if it was exposed.

For identifying the account, prefer the API command in the previous section because it prints only the GitHub login.

## Change the HTTPS authentication account

Changing HTTPS authentication is normally a two-stage process:

1. erase the existing GitHub credential from Keychain;
2. authenticate again as the desired GitHub account on the next authorized operation.

### Step 1: erase the stored GitHub HTTPS credential

```bash
printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain erase
```

This removes the matching `github.com` credential available to this helper. It does not delete a GitHub account, alter commits, or sign the browser out.

If multiple GitHub credentials are intentionally stored, use **Keychain Access** to inspect the exact matching item before deleting anything. Removing a credential means HTTPS operations that depended on it will need authentication again.

### Step 2: trigger authentication again

Inside a repository whose remote uses HTTPS, perform an operation that needs authentication, for example:

```bash
git fetch
```

or, when you genuinely have changes to send:

```bash
git push
```

Follow the authentication prompt and sign in as the intended account, such as `manikD1` or `manikdixit23`.

GitHub does not accept an ordinary GitHub account password for Git operations over HTTPS. Depending on the Git installation and helper, authentication may use a browser/OAuth flow or require a personal access token. If entering a personal access token manually, paste it only into the password prompt and do not save it in notes or commands.

### Step 3: verify the result

Run the safe GitHub API check again. Confirm that it prints the intended login.

## Optional: set a preferred HTTPS username

This can supply a username hint to the credential process:

```bash
git config --global credential.https://github.com.username manikD1
```

Check it with:

```bash
git config --global --get credential.https://github.com.username
```

Remove the hint with:

```bash
git config --global --unset credential.https://github.com.username
```

This hint does **not** change which account owns an existing token. The token or OAuth credential remains authoritative.

---

# How the three identities interact

## Example A: everything matches

```text
Browser login          → manikD1
Commit email belongs to→ manikD1
HTTPS token belongs to → manikD1
```

This is simple and usually causes the least confusion.

## Example B: browser and command line use different accounts

```text
Browser login          → manikD1
Commit email belongs to→ manikD1
HTTPS token belongs to → manikdixit23
```

Possible result:

- website activity is performed as `manikD1`;
- new commits may appear as `manikD1` if the email is verified there;
- pushes are authorized using `manikdixit23` and succeed only if that account has access.

## Example C: authentication works, but commit attribution is wrong

```text
Commit email belongs to→ manikD1
HTTPS token belongs to → manikdixit23
```

The push can succeed as `manikdixit23`, while the commit itself is attributed to `manikD1`. The pusher and the commit author are separate concepts.

## Diagnostic table

| Symptom | Most likely identity to inspect |
|---|---|
| Wrong account is shown on github.com | Browser login |
| Wrong name/email appears on a new commit | Git commit identity |
| Push says permission denied or repository not found | HTTPS/SSH authentication identity and repository access |
| Push succeeds, but commit links to the wrong profile | Commit email and the emails verified on GitHub |
| Keychain shows a numeric account value | Verify the credential owner with the GitHub API |
| Changing `user.name` did not fix push permission | Authentication identity, because `user.name` does not grant access |

---

# SSH authentication: an alternative to HTTPS

GitHub can also authenticate Git operations using SSH keys rather than HTTPS credentials.

An SSH remote usually looks like:

```text
git@github.com:OWNER/REPOSITORY.git
```

In that setup:

- authentication is based on an SSH private key on the Mac;
- the corresponding public key is registered with a GitHub account;
- macOS Keychain HTTPS tokens are not used for that remote;
- `user.name` and `user.email` still control commit identity exactly as before.

## Check the default GitHub SSH identity

```bash
ssh -T git@github.com
```

On a successful authentication, GitHub normally responds with a message identifying the account. GitHub does not provide an interactive shell; that part of the response is normal.

The first connection may ask you to confirm GitHub's host key. Verify the fingerprint against GitHub's official documentation before accepting it.

## Multiple GitHub accounts with SSH

Multiple accounts can be handled with separate SSH keys and host aliases in `~/.ssh/config`, with each repository remote using the correct alias. This is often cleaner for a deliberate multi-account setup, but it requires careful key and remote configuration.

Changing an HTTPS Keychain token does not change SSH authentication. Similarly, changing an SSH key does not change an HTTPS credential.

---

# Recommended checklists

## Quick identity audit inside a repository

```bash
# 1. What name and email will the next commit use?
git config --show-origin --get user.name
git config --show-origin --get user.email

# 2. What remote protocol and repository are configured?
git remote -v

# 3. If the remote is HTTPS, what credential helper is configured?
git config --show-origin --get-all credential.helper
```

Then:

- for HTTPS with `osxkeychain`, use the safe GitHub API command to identify the account;
- for SSH, use `ssh -T git@github.com` as a high-level identity check;
- separately check the account shown in the browser at GitHub.com.

## Before making commits in a repository

```bash
git config user.name
git config user.email
git status
```

Confirm that the email is associated with the intended GitHub account.

## After switching an HTTPS account

1. Verify the remote is HTTPS with `git remote -v`.
2. Verify `osxkeychain` is the helper.
3. Erase the old credential only after identifying the correct Keychain item.
4. Authenticate again as the intended account.
5. Run the safe GitHub API check.
6. Confirm the returned login is `manikD1` or `manikdixit23`, as intended.
7. Check repository access before pushing important work.

---

# Commands at a glance

## Commit identity

```bash
# Effective identity in the current repository
git config user.name
git config user.email

# Show where effective values came from
git config --show-origin --get user.name
git config --show-origin --get user.email

# Global default
git config --global --get user.name
git config --global --get user.email

# Set global default
git config --global user.name "Manik Dixit"
git config --global user.email "YOUR_EMAIL_ADDRESS"

# Set only for the current repository
git config --local user.name "Manik Dixit"
git config --local user.email "YOUR_EMAIL_ADDRESS"

# Remove current repository's overrides
git config --local --unset user.name
git config --local --unset user.email
```

## Remote and credential helper

```bash
git remote -v
git config --show-origin --get-all credential.helper
```

## HTTPS credential

```bash
# Erase the matching GitHub HTTPS credential from macOS Keychain
printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain erase

# Directly display the credential — DANGEROUS because this can print the token
printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain get
```

## SSH identity check

```bash
ssh -T git@github.com
```

---

# Final rule to remember

```text
GitHub.com browser session = website identity
Git user.name/user.email    = commit label and attribution
HTTPS token or SSH key      = authentication and repository access
```

When something looks wrong, first decide which of those three identities is responsible. That one distinction prevents most GitHub account confusion on macOS.

