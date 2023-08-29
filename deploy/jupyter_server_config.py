# Configuration file for jupyter-server.

c = get_config()  #noqa


#------------------------------------------------------------------------------
# ServerApp(JupyterApp) configuration
#------------------------------------------------------------------------------
## The Jupyter Server application class.
# Set ip to '*' to bind on all interfaces (ips) for the public server
c.ServerApp.ip = '*'
c.PasswordIdentityProvider.hashed_password = u'argon2:$argon2id$v=19$m=10240,t=10,p=8$CHAStSPvIUbVCty404+vtw$ofbatF3rhFM+I96IMAeCgh1yFXIOwFGzeFBpViee5AE'
c.PasswordIdentityProvider.password_required = True
c.PasswordIdentityProvider.allow_password_change = False
c.ServerApp.allow_root = False

# No need to open a browser
c.ServerApp.open_browser = False

# It is a good idea to set a known, fixed port for server access
c.ServerApp.port = 13013
