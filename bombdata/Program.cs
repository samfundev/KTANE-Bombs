using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using AngleSharp;
using AngleSharp.Css.Dom;
using AngleSharp.Dom;
using AngleSharp.Html.Dom;
using AngleSharp.Html.Parser;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;

namespace bombdata
{
	internal static class Program
	{
		private static void Main()
		{
			var sheetIds = new Dictionary<string, string>() {
				{ "KTaNE - Challenge Bombs Spreadsheets (Solved Section)", "1yQDBEpu0dO7-CFllakfURm4NGGdQl6tN-39m6O0Q_Ow" },
				{ "KTaNE - Challenge Bombs Spreadsheets (Unsolved Section)", "1k2LlhY-BBJQImEHo_S51L_okPiOee6xgdk5mkVwn2ZU" },
				{ "KTaNE - Challenge Bombs Spreadsheets (TP Section)", "1pzoatn2mX1gtKurxt1OBejbutTrKq0kqO9dNohnu33Q" },
			};

			var packs = new List<MissionPack>();
			var variantId = 0;
			foreach (string path in Directory.GetDirectories("bombhtml/"))
			{
				var listSheet = ParseSheet(Path.Combine(path, "Bomb List.html"));

				foreach (var file in Directory.GetFiles(path))
				{
					var fileName = Path.GetFileNameWithoutExtension(file);
					if (fileName.EqualsAny("Bomb List", "TP Solves", "Completers")) continue;

					var sheet = ParseSheet(file);
					var missionRow = listSheet.Skip(4).FirstOrDefault(row => row[0].Content.ToLowerInvariant().EqualsAny(sheet[0][0].Content.ToLowerInvariant(), fileName.ToLowerInvariant()));
					if (missionRow == null)
					{
						Console.WriteLine($"No match for \"{sheet[0][0].Content}\" or \"{fileName}\" {path[46..]}");
						continue;
					}

					var href = missionRow[1].Href;

					var pack = packs.Find(pack => pack.name == missionRow[1].Content);
					if (pack == null)
					{
						pack = new MissionPack()
						{
							name = missionRow[1].Content.Trim(),
							steamID = href[(href.IndexOf("=") + 1)..],
							missions = new List<Mission>(),
						};
						packs.Add(pack);
					}

					List<Completion> GetCompletions(int skip)
					{
						return sheet
							.Skip(skip)
							.Where(row => !string.IsNullOrEmpty(row[5].Content))
							.TakeWhile(row => row[6].ColSpan != 2)
							.Select(row =>
							{
								var sheetId = sheetIds[Path.GetFileName(path)];
								var proofCell = row[5];
								string[] proof = Array.Empty<string>();
								if (proofCell.Href == null)
								{
									var note = GetNote(sheetId, missionRow[0].Content, proofCell);
									if (note != null)
									{
										proof = note
											.Split(new[] { ' ', '\n' }, StringSplitOptions.RemoveEmptyEntries)
											.Where(part => Uri.IsWellFormedUriString(part, UriKind.Absolute))
											.ToArray();
									}
								}
								else
								{
									proof = new[] { proofCell.Href };
								}

								return new Completion()
								{
									proofs = proof,
									time = ParseTime(row[6].Content),
									team = Enumerable.Range(7, 4).SelectMany(index =>
									{
										var cell = row[index];
										var content = cell.Content.Trim();
										if (content != "et al.")
										{
											return new[] { content };
										}

										var note = GetNote(sheetId, missionRow[0].Content, cell);
										if (note == null)
										{
											Console.WriteLine("Could not find full team. Local spreadsheet data should be updated.");
											return Array.Empty<string>();
										}

										return note.Split(",").Select(name => name.Trim());
									}).Where(cell => !string.IsNullOrEmpty(cell)).ToList(),
									first = row[6].Style.GetBackgroundColor() == "rgba(255, 255, 0, 1)",
									old = row[6].Style.GetFontStyle() == "italic",
									solo = row[7].Style.GetBackgroundColor() == "rgba(0, 255, 255, 1)"
								};
							})
							.ToList();
					}

					var mission = new Mission()
					{
						name = missionRow[0].Content.Trim(),
						authors = missionRow[2].Content.Trim().Split(" & "),
						bombs = sheet.Skip(1).Where(row => !string.IsNullOrEmpty(row[2].Content)).Select(row =>
						{
							return new Bomb()
							{
								modules = int.Parse(row[1].Content),
								time = ParseTime(row[2].Content),
								strikes = int.Parse(row[3].Content),
								widgets = int.Parse(row[4].Content),
								pools = new List<Pool>(),
							};
						}).ToArray(),
						completions = GetCompletions(2),
						tpsolve = missionRow[7].Content == "Solved",
						designedfortp = Path.GetFileName(path) == "KTaNE - Challenge Bombs Spreadsheets (TP Section)",
					};

					var factory = sheet[mission.bombs.Length + 2][3].Content;
					if (mission.bombs.Length != 1 && factory.Length != 0)
					{
						mission.factory = factory;
					}

					var bombIndex = 0;
					for (int i = 2; i < sheet.Count; i++)
					{
						var content = sheet[i][11].Content;
						if (string.IsNullOrEmpty(content))
						{
							bombIndex++;
							i++;
						}
						else
						{
							var match = new Regex(@"\[?(.+)\] (?:\((.+)\) )?Count: (\d+)").Match(content);
							var modules = match.Groups[1].Value.Split(", ");

							// If the sources are listed, update the "module" to include the source.
							var sources = match.Groups[2].Value.Split(" + ", StringSplitOptions.RemoveEmptyEntries);
							if (sources.Length == 1)
							{
								var source = sources[0] == "Mod" ? "MODS" : "VANILLA";
								modules[0] = $"ALL_{source}_{modules[0][4..]}";
							}

							mission.bombs[bombIndex].pools.Add(new Pool()
							{
								count = int.Parse(match.Groups[3].Value),
								modules = modules
							});

							i += sheet[i][11].RowSpan - 1;
						}
					}

					pack.missions.Add(mission);

					var variants = sheet.Skip(2).Where(row => row[6].ColSpan == 2 && row[6].Style.GetColor() == "rgba(0, 0, 0, 1)");
					if (variants.Any())
					{
						mission.variant = variantId++;

						foreach (var header in variants)
						{
							var completions = GetCompletions(header[0].Y + 1);
							var variant = mission.ShallowCopy();
							variant.name = header[6].Content;
							variant.completions = completions;

							pack.missions.Add(variant);
						}
					}
				}
			}

			File.WriteAllText("bombs.json", JsonSerializer.Serialize(packs));
		}

		private static float ParseTime(string time)
		{
			if (time.EndsWith("*")) time = time[0..^1];

			var parts = time.Split(":");
			if (parts.Length == 1) return float.Parse(time);

			return (int.Parse(parts[0]) * 60) + int.Parse(parts[1]);
		}

		private static List<List<Cell>> ParseSheet(string path)
		{
			var fileContent = File.ReadAllText(path);
			var document = new HtmlParser(new HtmlParserOptions(), BrowsingContext.New(Configuration.Default.WithCss())).ParseDocument(fileContent);

			var rows = document.QuerySelectorAll("tr").Skip(1);
			var columns = rows.Max(row => row.ChildElementCount);

			var sheet = new List<List<Cell>>();

			for (int i = 0; i < rows.Count(); i++)
			{
				sheet.Add(Enumerable.Repeat<Cell>(null, columns).ToList());
			}

			var x = 0;
			var y = 0;
			foreach (var row in rows)
			{
				foreach (var cell in row.Children.Skip(1))
				{
					int colspan = int.Parse(cell.GetAttribute("colspan") ?? "1");
					int rowspan = int.Parse(cell.GetAttribute("rowspan") ?? "1");

					var content = cell.TextContent;
					var link = cell.QuerySelector<IHtmlAnchorElement>("a");

					for (int xOffset = 0; xOffset < colspan; xOffset++)
					{
						for (int yOffset = 0; yOffset < rowspan; yOffset++)
						{
							sheet[y + yOffset][x + xOffset] = new Cell()
							{
								X = x,
								Y = y,
								Content = content,
								Element = cell,
								ColSpan = colspan,
								RowSpan = rowspan
							};

							if (link != null)
							{
								sheet[y + yOffset][x + xOffset].Href = link.Href;
							}
						}
					}

					x += colspan;
					while (sheet[y][x] != null)
					{
						x++;
					}
				}

				x = 0;
				y++;

				while (y < rows.Count() && sheet[y][x] != null)
				{
					x++;
				}
			}

			return sheet;
		}

		private static string GetNote(string spreadsheetId, string sheet, Cell cell)
		{
			SheetsService sheetsService = new(new BaseClientService.Initializer
			{
				ApiKey = File.ReadAllText(".key"),
				ApplicationName = "Notes",
			});

			SpreadsheetsResource.GetRequest request = sheetsService.Spreadsheets.Get(spreadsheetId);
			request.Ranges = new List<string>() { $"'{sheet.Replace("'", "''")}'!{(char)(cell.X + 'A')}{cell.Y + 1}" };
			request.Fields = "sheets/data/rowData/values/note";

			Spreadsheet response = request.Execute();

			return response.Sheets[0].Data[0].RowData?[0].Values[0].Note;
		}
	}

	public static class Extensions
	{
		public static bool EqualsAny(this object obj, params object[] objects) => objects.Contains(obj);
	}

	internal class Cell
	{
		public int X;
		public int Y;
		public string Content;
		public string Href;
		public IElement Element;
		public int RowSpan;
		public int ColSpan;

		private ICssStyleDeclaration style;
		public ICssStyleDeclaration Style => style ??= Element.ComputeCurrentStyle();
	}

	internal class MissionPack
	{
		public string name { get; set; }
		public string steamID { get; set; }
		public List<Mission> missions { get; set; }
	}

	internal class Mission
	{
		public string name { get; set; }
		public string[] authors { get; set; }
		public Bomb[] bombs { get; set; }
		public List<Completion> completions { get; set; }
		public bool tpsolve { get; set; }
		public bool designedfortp { get; set; }
		public string factory { get; set; }
		public int? variant { get; set; }

		public Mission ShallowCopy()
		{
			return (Mission)MemberwiseClone();
		}
	}

	internal class Bomb
	{
		public int modules { get; set; }
		public float time { get; set; }
		public int strikes { get; set; }
		public int widgets { get; set; }
		public List<Pool> pools { get; set; }
	}

	internal class Pool
	{
		public string[] modules { get; set; }
		public int count { get; set; }
	}

	internal class Completion
	{
		public string[] proofs { get; set; }
		public float time { get; set; }
		public List<string> team { get; set; }
		public bool first { get; set; }
		public bool old { get; set; }
		public bool solo { get; set; }
		public string? season { get; set; }
	}
}
