from flask import Blueprint, render_template


webui = Blueprint(
    'webui',
    __name__,
    url_prefix='/webui',
    template_folder='../gui',
    static_folder='../gui/static')


@webui.route("/", defaults={'path': ''})
@webui.route('/<path:path>')
def serve(path):
    print(path)
    return render_template('index.html')
