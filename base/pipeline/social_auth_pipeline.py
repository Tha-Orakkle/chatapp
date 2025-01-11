""" Update user object with social authentication details """
from social_core.backends.github import GithubOAuth2


def update_user_pipeline(strategy, details, backend, user=None, *args, **kwargs):
    if user:
        if isinstance(backend, GithubOAuth2):
            if details.get('email') and not user.email:
                user.email = details.get('email')
                user.save()
        if not user.profile.full_name:
            first_name = details.get('first_name').strip() or ''
            last_name = details.get('last_name').strip() or ''
            user.profile.full_name = first_name + ' ' + last_name
            user.profile.save()
