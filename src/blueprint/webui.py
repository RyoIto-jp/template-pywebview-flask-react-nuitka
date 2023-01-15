from flask import Blueprint, render_template


webui = Blueprint(
    'webui',
    __name__,
    url_prefix='/webui',
    template_folder='../../web/gui',
    static_folder='../../web/gui/static')


@webui.route("/", defaults={'path': ''})
@webui.route('/<path:path>')
def serve(path):
    print(path)
    return render_template('index.html')
