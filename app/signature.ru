require 'openssl'
require 'rack/utils'
SHARED_SECRET = 'hush'

# Use request.query_string in rails
query_string = "extra=1&extra=2&shop={shop}.myshopify.com&logged_in_customer_id=1&path_prefix=%2Fapps%2Fawesome_reviews&timestamp=1317327555&signature=4c68c8624d737112c91818c11017d24d334b524cb5c2b8ba08daa056f7395ddb"

query_hash = Rack::Utils.parse_query(query_string)
# => {
#   "extra" => ["1", "2"],
#   "shop" => "{shop}.myshopify.com",
#   "logged_in_customer_id" => 1,
#   "path_prefix" => "/apps/awesome_reviews",
#   "timestamp" => "1317327555",
#   "signature" => "4c68c8624d737112c91818c11017d24d334b524cb5c2b8ba08daa056f7395ddb",
# }

# Remove and save the "signature" entry
signature = query_hash.delete("signature")

sorted_params = query_hash.collect{ |k, v| "#{k}=#{Array(v).join(',')}" }.sort.join
# => "extra=1,2logged_in_customer_id=1path_prefix=/apps/awesome_reviewsshop={shop}.myshopify.comtimestamp=1317327555"

calculated_signature = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), SHARED_SECRET, sorted_params)
raise 'Invalid signature' unless ActiveSupport::SecurityUtils.secure_compare(signature, calculated_signature)